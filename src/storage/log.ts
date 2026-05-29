import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LogEntry {
  id: string;
  phone: string;
  status: 'SENT' | 'FAILED';
  failReason?: string | null;
  at: number; // epoch ms
}

const KEY = 'sms.log';
const MAX = 100;

/** Prepends an entry and trims to the last MAX (newest first). */
export async function appendLog(entry: LogEntry): Promise<void> {
  const list = await readLog();
  list.unshift(entry);
  await AsyncStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export async function readLog(): Promise<LogEntry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as LogEntry[]) : [];
}

export async function clearLog(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
