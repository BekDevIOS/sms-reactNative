import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {BASE_URL} from '@env';
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
} from '../storage/config';

const DEFAULT_BASE_URL = BASE_URL ?? 'http://192.168.1.10:4008';

interface AppContextValue {
  ready: boolean;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
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
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [member, setMember] = useState<MemberAuth | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [workerState, setWorkerState] = useState<WorkerState>(worker.getState());

  useEffect(() => {
    const unsub = worker.subscribe(setWorkerState);
    (async () => {
      await worker.init();
      const savedMember = await loadMemberAuth();
      const savedConfig = await loadConfig();
      if (savedMember) {
        setMember(savedMember);
        setBaseUrl(savedMember.baseUrl);
      }
      setConfig(savedConfig);
      // Auto-resume the worker if a device was active and running.
      if (savedConfig && (await getWorkerEnabled())) {
        await worker.configure(savedConfig);
        await startWorker();
      }
      setReady(true);
    })();
    return unsub;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await ApiClient.login(baseUrl, {
        memberEmail: email,
        memberPassword: password,
      });
      const auth: MemberAuth = {
        baseUrl,
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
    [baseUrl],
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
      const res = await ApiClient.claim(baseUrl, code);
      const cfg: AppConfig = {
        baseUrl,
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
    [baseUrl],
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
        baseUrl,
        setBaseUrl,
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
