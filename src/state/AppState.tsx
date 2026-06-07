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
} from '../storage/config';

// Production default points at the HTTPS API. For LAN development, set BASE_URL
// in .env (e.g. http://192.168.1.10:4008) — release builds forbid cleartext.
const DEFAULT_BASE_URL = BASE_URL ?? 'https://api.carmoa.store';

/** Builds the persisted MemberAuth from an auth/me response. Role defaults to USER. */
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
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  member: MemberAuth | null;
  config: AppConfig | null;
  workerState: WorkerState;
  /** True when the logged-in member is ADMIN or OWNER. */
  isAdmin: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (body: RegisterBody) => Promise<void>;
  /** Re-fetch /member/me and update the cached member (e.g. after editing profile). */
  refreshMe: () => Promise<void>;
  /** POST /member/me then update the cached member. */
  updateMe: (body: UpdateMeBody) => Promise<void>;
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
      const auth = toMemberAuth(baseUrl, res.token, res.member);
      await saveMemberAuth(auth);
      setMember(auth);
    },
    [baseUrl],
  );

  const register = useCallback(
    async (body: RegisterBody) => {
      const res = await ApiClient.register(baseUrl, body);
      const auth = toMemberAuth(baseUrl, res.token, res.member);
      await saveMemberAuth(auth);
      setMember(auth);
    },
    [baseUrl],
  );

  const refreshMe = useCallback(async () => {
    if (!member) {
      return;
    }
    const me = await new ApiClient(member.baseUrl, member.memberToken).getMe();
    const auth = toMemberAuth(member.baseUrl, member.memberToken, me);
    await saveMemberAuth(auth);
    setMember(auth);
  }, [member]);

  const updateMe = useCallback(
    async (body: UpdateMeBody) => {
      if (!member) {
        return;
      }
      const me = await new ApiClient(member.baseUrl, member.memberToken).updateMe(body);
      const auth = toMemberAuth(member.baseUrl, member.memberToken, me);
      await saveMemberAuth(auth);
      setMember(auth);
    },
    [member],
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

  const isAdmin = member?.memberRole === 'ADMIN' || member?.memberRole === 'OWNER';

  return (
    <Ctx.Provider
      value={{
        ready,
        baseUrl,
        setBaseUrl,
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
