import AsyncStorage from '@react-native-async-storage/async-storage';
import {ReportBody} from '../api/types';

const KEY = 'sms.pendingReports';

type PendingMap = Record<string, ReportBody>;

async function readMap(): Promise<PendingMap> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as PendingMap) : {};
}

async function writeMap(map: PendingMap): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

export async function readPendingReports(): Promise<ReportBody[]> {
  return Object.values(await readMap());
}

export async function savePendingReport(report: ReportBody): Promise<void> {
  const map = await readMap();
  map[report.recipientId] = report;
  await writeMap(map);
}

export async function removePendingReport(recipientId: string): Promise<void> {
  const map = await readMap();
  delete map[recipientId];
  await writeMap(map);
}
