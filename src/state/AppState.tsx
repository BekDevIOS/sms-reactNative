import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {ApiClient} from '../api/client';
import {worker, WorkerState} from '../worker/worker';
import {startWorker, stopWorker} from '../worker/foregroundService';
import {
  AppConfig,
  clearAll,
  clearDeviceConfig,
  getWorkerEnabled,
  loadConfig,
  loadMemberAuth,
  MemberAuth,
  saveConfig,
  saveMemberAuth,
  setWorkerEnabled,
} from '../storage/config';

const PRODUCTION_BASE_URL = 'https://api.carmoa.store';

interface AppContextValue {
  ready: boolean;
  member: MemberAuth | null;
  config: AppConfig | null;
  workerState: WorkerState;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Claim a device by its code and make it the active worker device. */
  selectDevice: (code: string) => Promise<void>;
  /** Create a new device slot then claim it. Throws DeviceLimitError if capped. */
  createDevice: (name: string, phone?: string) => Promise<void>;
  /** Drop the active device session (back to device selection). */
  switchDevice: () => Promise<void>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

const Ctx = createContext<AppContextValue | undefined>(undefined);

export function AppStateProvider({children}: {children: React.ReactNode}) {
  const [ready, setReady] = useState(false);
  const [member, setMember] = useState<MemberAuth | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [workerState, setWorkerState] = useState<WorkerState>(worker.getState());

  useEffect(() => {
    const unsub = worker.subscribe(setWorkerState);
    (async () => {
      await worker.init();
      const rawMember = await loadMemberAuth();
      const rawConfig = await loadConfig();
      const savedMember = rawMember
        ? {...rawMember, baseUrl: PRODUCTION_BASE_URL}
        : null;
      const savedConfig = rawConfig
        ? {...rawConfig, baseUrl: PRODUCTION_BASE_URL}
        : null;
      if (savedMember) {
        if (rawMember?.baseUrl !== PRODUCTION_BASE_URL) {
          await saveMemberAuth(savedMember);
        }
        setMember(savedMember);
      }
      if (savedConfig && rawConfig?.baseUrl !== PRODUCTION_BASE_URL) {
        await saveConfig(savedConfig);
      }
      setConfig(savedConfig);
      if (savedConfig) {
        await worker.configure(savedConfig);
      }
      // Auto-resume the worker if a device was active and running.
      if (savedConfig && (await getWorkerEnabled())) {
        try {
          await startWorker();
        } catch {
          await setWorkerEnabled(false);
        }
      }
      setReady(true);
    })();
    return unsub;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await ApiClient.login(PRODUCTION_BASE_URL, {
        memberEmail: email,
        memberPassword: password,
      });
      const auth: MemberAuth = {
        baseUrl: PRODUCTION_BASE_URL,
        memberToken: res.token,
        memberId: res.member._id,
        memberEmail: res.member.memberEmail,
        memberName: [res.member.memberFirstName, res.member.memberLastName]
          .filter(Boolean)
          .join(' '),
        memberDevices: res.member.memberDevices,
      };
      await saveMemberAuth(auth);
      setMember(auth);
    },
    [],
  );

  const logout = useCallback(async () => {
    await stopWorker();
    if (member) {
      try {
        await new ApiClient(member.baseUrl, member.memberToken).logout();
      } catch {
        // best-effort
      }
    }
    await clearAll();
    await worker.clear();
    setConfig(null);
    setMember(null);
  }, [member]);

  /** Shared: claim a code → persist device config → point the worker at it. */
  const activateDevice = useCallback(
    async (code: string) => {
      const res = await ApiClient.claim(PRODUCTION_BASE_URL, code);
      const cfg: AppConfig = {
        baseUrl: PRODUCTION_BASE_URL,
        token: res.token,
        deviceId: res.device.deviceId,
        deviceName: res.device.name,
        sendLimitPerMinute: res.device.sendLimitPerMinute ?? 60,
      };
      await saveConfig(cfg);
      await worker.configure(cfg);
      await worker.resetCounters();
      setConfig(cfg);
    },
    [],
  );

  const selectDevice = useCallback((code: string) => activateDevice(code), [activateDevice]);

  const createDevice = useCallback(
    async (name: string, phone?: string) => {
      if (!member) {
        throw new Error('Not logged in');
      }
      const created = await new ApiClient(member.baseUrl, member.memberToken).createDevice({
        name,
        platform: 'ANDROID',
        phone: phone || undefined,
      });
      await activateDevice(created.code);
    },
    [member, activateDevice],
  );

  const switchDevice = useCallback(async () => {
    await stopWorker();
    await clearDeviceConfig();
    await worker.clear();
    setConfig(null);
  }, []);

  const start = useCallback(async () => {
    await startWorker();
  }, []);

  const stop = useCallback(async () => {
    await stopWorker();
  }, []);

  return (
    <Ctx.Provider
      value={{
        ready,
        member,
        config,
        workerState,
        login,
        logout,
        selectDevice,
        createDevice,
        switchDevice,
        start,
        stop,
      }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAppState(): AppContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return ctx;
}
