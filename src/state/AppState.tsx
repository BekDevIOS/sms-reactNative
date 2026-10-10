import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {BASE_URL} from '@env';
import {ApiClient} from '../api/client';
import type {MemberRole, RegisterBody, UpdateMeBody} from '../api/types';
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

const API_BASE_URL = (BASE_URL?.trim() || 'https://api.carmoa.store').replace(/\/+$/, '');

function toMemberAuth(
  baseUrl: string,
  token: string,
  m: {
    _id: string;
    memberEmail: string;
    memberFirstName: string;
    memberLastName?: string;
    memberDevices: number;
    memberRole?: MemberRole;
    memberPhone?: string;
    memberCompanyName?: string;
    memberImage?: string;
  },
): MemberAuth {
  return {
    baseUrl,
    memberToken: token,
    memberId: m._id,
    memberEmail: m.memberEmail,
    memberName: [m.memberFirstName, m.memberLastName].filter(Boolean).join(' '),
    memberDevices: m.memberDevices,
    memberRole: (m.memberRole as MemberRole) ?? 'USER',
    memberPhone: m.memberPhone,
    memberCompanyName: m.memberCompanyName,
    memberImage: m.memberImage,
  };
}

interface AppContextValue {
  ready: boolean;
  member: MemberAuth | null;
  config: AppConfig | null;
  workerState: WorkerState;
  isAdmin: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (body: RegisterBody) => Promise<void>;
  refreshMe: () => Promise<void>;
  updateMe: (body: UpdateMeBody) => Promise<void>;
  logout: () => Promise<void>;
  selectDevice: (code: string) => Promise<void>;
  createDevice: (name: string, phone?: string) => Promise<void>;
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
      const savedMember = rawMember ? {...rawMember, baseUrl: API_BASE_URL} : null;
      const savedConfig = rawConfig ? {...rawConfig, baseUrl: API_BASE_URL} : null;

      if (savedMember) {
        if (rawMember?.baseUrl !== API_BASE_URL) {
          await saveMemberAuth(savedMember);
        }
        setMember(savedMember);
      }
      if (savedConfig && rawConfig?.baseUrl !== API_BASE_URL) {
        await saveConfig(savedConfig);
      }
      setConfig(savedConfig);
      if (savedConfig) {
        await worker.configure(savedConfig);
      }
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

  const login = useCallback(async (email: string, password: string) => {
    const res = await ApiClient.login(API_BASE_URL, {
      memberEmail: email,
      memberPassword: password,
    });
    const auth = toMemberAuth(API_BASE_URL, res.token, res.member);
    await saveMemberAuth(auth);
    setMember(auth);
  }, []);

  const register = useCallback(async (body: RegisterBody) => {
    const res = await ApiClient.register(API_BASE_URL, body);
    const auth = toMemberAuth(API_BASE_URL, res.token, res.member);
    await saveMemberAuth(auth);
    setMember(auth);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!member) {
      return;
    }
    const me = await new ApiClient(API_BASE_URL, member.memberToken).getMe();
    const auth = toMemberAuth(API_BASE_URL, member.memberToken, me);
    await saveMemberAuth(auth);
    setMember(auth);
  }, [member]);

  const updateMe = useCallback(
    async (body: UpdateMeBody) => {
      if (!member) {
        return;
      }
      const me = await new ApiClient(API_BASE_URL, member.memberToken).updateMe(body);
      const auth = toMemberAuth(API_BASE_URL, member.memberToken, me);
      await saveMemberAuth(auth);
      setMember(auth);
    },
    [member],
  );

  const logout = useCallback(async () => {
    await stopWorker();
    if (member) {
      try {
        await new ApiClient(API_BASE_URL, member.memberToken).logout();
      } catch {
        // best-effort
      }
    }
    await clearAll();
    await worker.clear();
    setConfig(null);
    setMember(null);
  }, [member]);

  const activateDevice = useCallback(async (code: string) => {
    const res = await ApiClient.claim(API_BASE_URL, code);
    const cfg: AppConfig = {
      baseUrl: API_BASE_URL,
      token: res.token,
      deviceId: res.device.deviceId,
      deviceName: res.device.name,
      sendLimitPerMinute: res.device.sendLimitPerMinute ?? 60,
    };
    await saveConfig(cfg);
    await worker.configure(cfg);
    await worker.resetCounters();
    setConfig(cfg);
  }, []);

  const selectDevice = useCallback((code: string) => activateDevice(code), [activateDevice]);

  const createDevice = useCallback(
    async (name: string, phone?: string) => {
      if (!member) {
        throw new Error('Not logged in');
      }
      const created = await new ApiClient(API_BASE_URL, member.memberToken).createDevice({
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

  const isAdmin = member?.memberRole === 'ADMIN' || member?.memberRole === 'OWNER';

  return (
    <Ctx.Provider
      value={{
        ready,
        member,
        config,
        workerState,
        isAdmin,
        login,
        register,
        refreshMe,
        updateMe,
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
