import AsyncStorage from '@react-native-async-storage/async-storage';
import {ReportBody} from '../api/types';

const KEY = 'sms.pendingReports';

export async function readPendingReports(): Promise<ReportBody[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as ReportBody[]) : [];
}

export async function savePendingReport(report: ReportBody): Promise<void> {
  const reports = await readPendingReports();
  const next = reports.filter(item => item.recipientId !== report.recipientId);
  next.push(report);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function removePendingReport(recipientId: string): Promise<void> {
  const reports = await readPendingReports();
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(reports.filter(item => item.recipientId !== recipientId)),
  );
}
