import {ApiClient, UnauthorizedError} from '../api/client';
import {ReportBody} from '../api/types';
import {
  AppConfig,
  EMPTY_COUNTERS,
  loadConfig,
  loadCounters,
  saveCounters,
  SessionCounters,
} from '../storage/config';
import {appendLog} from '../storage/log';
import {sendSms} from '../sms/DirectSms';
import {hasSendSmsPermission} from '../permissions';
import {getAppVersion, getBatteryLevel, getNetworkType} from '../device';

export interface WorkerState {
  running: boolean;
  status: 'ONLINE' | 'OFFLINE';
  counters: SessionCounters;
  lastPollAt: number | null;
  lastHeartbeatAt: number | null;
  batteryLevel: number;
  networkType: string;
  needsRePair: boolean;
  permissionDenied: boolean;
  lastError: string | null;
}

type Listener = (s: WorkerState) => void;

const HEARTBEAT_INTERVAL_MS = 30_000;
const IDLE_SLEEP_MS = 20_000; // no jobs → poll less often, keep heartbeating
const BUSY_SLEEP_MS = 6_000; // jobs present → poll again soon
const ERROR_BACKOFF_MS = 10_000; // network/transient error → back off, retry
const REPORT_ATTEMPTS = 3;

function errMsg(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  return String(e);
}

/**
 * The send worker. A single controllable async loop intended to run inside the
 * notifee foreground-service task. Holds observable state so the UI can subscribe.
 * Module-level singleton (see bottom) — UI and the FG service share one instance.
 */
class Worker {
  private client: ApiClient | null = null;
  private config: AppConfig | null = null;
  private enabled = false;
  private looping = false;
  private onProgress?: () => void;

  private readonly listeners = new Set<Listener>();

  /** Rolling-window of recent send timestamps for the per-minute rate cap. */
  private sendTimestamps: number[] = [];

  private state: WorkerState = {
    running: false,
    status: 'OFFLINE',
    counters: {...EMPTY_COUNTERS},
    lastPollAt: null,
    lastHeartbeatAt: null,
    batteryLevel: 0,
    networkType: 'UNKNOWN',
    needsRePair: false,
    permissionDenied: false,
    lastError: null,
  };

  // ---- observable state ----

  getState(): WorkerState {
    return {...this.state, counters: {...this.state.counters}};
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snap = this.getState();
    this.listeners.forEach(l => l(snap));
  }

  private patch(p: Partial<WorkerState>): void {
    this.state = {...this.state, ...p};
    this.emit();
  }

  // ---- lifecycle / config ----

  isEnabled(): boolean {
    return this.enabled;
  }

  getConfig(): AppConfig | null {
    return this.config;
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
  }

  setOnProgress(cb?: () => void): void {
    this.onProgress = cb;
  }

  /** Load persisted config + counters into memory (idempotent). */
  async init(): Promise<void> {
    if (!this.config) {
      this.config = await loadConfig();
      if (this.config) {
        this.client = new ApiClient(this.config.baseUrl, this.config.token);
      }
    }
    const counters = await loadCounters();
    this.patch({counters});
  }

  /** Point the worker at a (freshly paired) config. */
  async configure(cfg: AppConfig): Promise<void> {
    this.config = cfg;
    this.client = new ApiClient(cfg.baseUrl, cfg.token);
    this.patch({needsRePair: false});
  }

  async resetCounters(): Promise<void> {
    const c = {...EMPTY_COUNTERS};
    this.patch({counters: c});
    await saveCounters(c);
  }

  /** Wipe in-memory state on unpair. */
  async clear(): Promise<void> {
    this.enabled = false;
    this.config = null;
    this.client = null;
    this.sendTimestamps = [];
    this.patch({
      running: false,
      status: 'OFFLINE',
      counters: {...EMPTY_COUNTERS},
      needsRePair: false,
      permissionDenied: false,
      lastError: null,
      lastPollAt: null,
      lastHeartbeatAt: null,
    });
  }

  // ---- the loop ----

  /** Entry point called by the foreground-service task. Runs until disabled. */
  async run(): Promise<void> {
    if (this.looping) {
      return;
    }
    if (!this.config) {
      await this.init();
    }
    if (!this.config || !this.client) {
      return;
    }
    this.enabled = true;
    this.looping = true;
    this.patch({running: true, status: 'ONLINE', needsRePair: false, lastError: null});
    try {
      await this.loop();
    } finally {
      this.looping = false;
      this.patch({running: false, status: 'OFFLINE'});
    }
  }

  /** Stop the loop and send a best-effort OFFLINE heartbeat. */
  async stop(): Promise<void> {
    this.enabled = false;
    this.patch({running: false, status: 'OFFLINE'});
    try {
      await this.client?.heartbeat({status: 'OFFLINE', appVersion: getAppVersion()});
    } catch {
      // best-effort
    }
  }

  private async loop(): Promise<void> {
    while (this.enabled) {
      try {
        await this.maybeHeartbeat();
        const sleepMs = await this.pollAndSend();
        await this.sleep(sleepMs);
      } catch (e) {
        if (e instanceof UnauthorizedError) {
          // Token invalid → stop and require re-pair.
          this.enabled = false;
          this.patch({
            needsRePair: true,
            status: 'OFFLINE',
            lastError: 'Token rejected (401). Re-pair the device.',
          });
          break;
        }
        // Network / transient → back off and keep retrying (never crash).
        this.patch({lastError: errMsg(e)});
        await this.sleep(ERROR_BACKOFF_MS);
      }
    }
  }

  private async maybeHeartbeat(): Promise<void> {
    const now = Date.now();
    if (
      this.state.lastHeartbeatAt !== null &&
      now - this.state.lastHeartbeatAt < HEARTBEAT_INTERVAL_MS
    ) {
      return;
    }
    const batteryLevel = await getBatteryLevel();
    const networkType = await getNetworkType();
    this.patch({batteryLevel, networkType});
    await this.client!.heartbeat({
      status: 'ONLINE',
      batteryLevel,
      networkType,
      appVersion: getAppVersion(),
    });
    this.patch({lastHeartbeatAt: Date.now(), status: 'ONLINE'});
  }

  /** Polls for jobs and sends them sequentially. Returns how long to sleep next. */
  private async pollAndSend(): Promise<number> {
    const limit = this.config!.sendLimitPerMinute || 60;

    // Permission gate: if SEND_SMS is denied we still poll, but fail-report every
    // claimed job so nothing is silently dropped (and the backend isn't left waiting).
    const hasPerm = await hasSendSmsPermission();
    if (!hasPerm) {
      this.patch({permissionDenied: true});
      const jobs = await this.client!.pollJobs(limit);
      this.patch({lastPollAt: Date.now()});
      for (const job of jobs) {
        if (!this.enabled) {
          break;
        }
        await this.reportWithRetry({
          recipientId: job.recipientId,
          status: 'FAILED',
          failReason: 'sms_permission_denied',
          providerResponse: null,
        });
        await this.recordResult(job.phone, 'FAILED', 'sms_permission_denied', job.recipientId);
      }
      return jobs.length ? BUSY_SLEEP_MS : IDLE_SLEEP_MS;
    }
    this.patch({permissionDenied: false});

    // Respect the per-minute rate cap: don't request more than we can send right now.
    const budget = Math.min(limit, this.tokensAvailable(limit));
    if (budget <= 0) {
      return BUSY_SLEEP_MS;
    }

    const jobs = await this.client!.pollJobs(budget);
    this.patch({lastPollAt: Date.now()});
    if (jobs.length === 0) {
      return IDLE_SLEEP_MS;
    }

    for (const job of jobs) {
      if (!this.enabled) {
        break;
      }
      await this.rateGate(limit);

      this.patch({
        counters: {...this.state.counters, inProgress: this.state.counters.inProgress + 1},
      });

      const result = await sendSms(job.phone, job.message);
      this.recordSend();

      await this.reportWithRetry({
        recipientId: job.recipientId,
        status: result.status,
        failReason: result.status === 'FAILED' ? result.failReason ?? 'send_error' : null,
        providerResponse: result.providerResponse ?? null,
      });

      await this.recordResult(
        job.phone,
        result.status,
        result.status === 'FAILED' ? result.failReason ?? 'send_error' : null,
        job.recipientId,
      );
      this.onProgress?.();
    }

    return BUSY_SLEEP_MS;
  }

  /** Updates counters (decrementing in-progress), persists, and appends to the log. */
  private async recordResult(
    phone: string,
    status: 'SENT' | 'FAILED',
    failReason: string | null,
    recipientId: string,
  ): Promise<void> {
    const counters = {...this.state.counters};
    counters.inProgress = Math.max(0, counters.inProgress - 1);
    if (status === 'SENT') {
      counters.sent += 1;
    } else {
      counters.failed += 1;
    }
    this.patch({counters});
    await saveCounters(counters);
    await appendLog({
      id: `${recipientId}:${Date.now()}`,
      phone,
      status,
      failReason,
      at: Date.now(),
    });
  }

  private async reportWithRetry(body: ReportBody): Promise<void> {
    for (let i = 0; i < REPORT_ATTEMPTS; i++) {
      try {
        // success:false ⇒ duplicate/late report; already handled, not an error.
        await this.client!.report(body);
        return;
      } catch (e) {
        if (e instanceof UnauthorizedError) {
          throw e;
        }
        if (i === REPORT_ATTEMPTS - 1) {
          // Give up — the backend reclaims unreported PROCESSING jobs after ~5 min.
          this.patch({lastError: `report failed: ${errMsg(e)}`});
          return;
        }
        await this.sleep(1500 * (i + 1));
      }
    }
  }

  // ---- rate limiting (rolling minute + min spacing) ----

  private tokensAvailable(limit: number): number {
    const now = Date.now();
    this.sendTimestamps = this.sendTimestamps.filter(t => now - t < 60_000);
    return limit - this.sendTimestamps.length;
  }

  private recordSend(): void {
    this.sendTimestamps.push(Date.now());
  }

  private async rateGate(limit: number): Promise<void> {
    const spacing = Math.floor(60_000 / Math.max(1, limit));
    const last = this.sendTimestamps[this.sendTimestamps.length - 1];
    if (last !== undefined) {
      const wait = spacing - (Date.now() - last);
      if (wait > 0) {
        await this.sleep(wait);
      }
    }
    // Block while the rolling-minute window is full.
    while (this.enabled && this.tokensAvailable(limit) <= 0) {
      const oldest = this.sendTimestamps[0];
      const wait = oldest ? Math.max(250, 60_000 - (Date.now() - oldest)) : 250;
      await this.sleep(Math.min(wait, 2_000));
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const worker = new Worker();
