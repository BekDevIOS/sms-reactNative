import AsyncStorage from '@react-native-async-storage/async-storage';
import type {MemberRole} from '../api/types';

/** Member session — obtained from email/password login. Used for device management. */
export interface MemberAuth {
  baseUrl: string;
  memberToken: string;
  memberId: string;
  memberEmail: string;
  memberName: string;
  memberDevices: number;
  /** Defaults to 'USER' for sessions saved before role was persisted. */
  memberRole: MemberRole;
  memberPhone?: string;
  memberCompanyName?: string;
  memberImage?: string;
}

/** Device session — obtained by claiming a device's code. Used by the worker. */
export interface AppConfig {
  baseUrl: string;
  token: string; // device session token
  deviceId: string;
  deviceName: string;
  sendLimitPerMinute: number;
  selectedSimSubscriptionId?: number;
  selectedSimSlotIndex?: number;
  selectedSimCarrier?: string;
}

export interface SessionCounters {
  sent: number;
  failed: number;
  inProgress: number;
}

export const EMPTY_COUNTERS: SessionCounters = {sent: 0, failed: 0, inProgress: 0};

const KEYS = {
  member: 'sms.member',
  config: 'sms.config',
  workerEnabled: 'sms.workerEnabled',
  counters: 'sms.counters',
};

// ---- member auth ----

export async function saveMemberAuth(auth: MemberAuth): Promise<void> {
  await AsyncStorage.setItem(KEYS.member, JSON.stringify(auth));
}

export async function loadMemberAuth(): Promise<MemberAuth | null> {
  const raw = await AsyncStorage.getItem(KEYS.member);
  return raw ? (JSON.parse(raw) as MemberAuth) : null;
}

// ---- device config ----

export async function saveConfig(cfg: AppConfig): Promise<void> {
  await AsyncStorage.setItem(KEYS.config, JSON.stringify(cfg));
}

export async function loadConfig(): Promise<AppConfig | null> {
  const raw = await AsyncStorage.getItem(KEYS.config);
  return raw ? (JSON.parse(raw) as AppConfig) : null;
}

/** Clears the device session only (worker flag + counters too). Keeps member login. */
export async function clearDeviceConfig(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(KEYS.config),
    AsyncStorage.removeItem(KEYS.workerEnabled),
    AsyncStorage.removeItem(KEYS.counters),
  ]);
}

/** Full logout — clears member auth and the device session. */
export async function clearAll(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(KEYS.member),
    AsyncStorage.removeItem(KEYS.config),
    AsyncStorage.removeItem(KEYS.workerEnabled),
    AsyncStorage.removeItem(KEYS.counters),
  ]);
}

// ---- worker flag + counters ----

export async function setWorkerEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.workerEnabled, enabled ? '1' : '0');
}

export async function getWorkerEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.workerEnabled)) === '1';
}

export async function saveCounters(c: SessionCounters): Promise<void> {
  await AsyncStorage.setItem(KEYS.counters, JSON.stringify(c));
}

export async function loadCounters(): Promise<SessionCounters> {
  const raw = await AsyncStorage.getItem(KEYS.counters);
  return raw ? (JSON.parse(raw) as SessionCounters) : {...EMPTY_COUNTERS};
}
