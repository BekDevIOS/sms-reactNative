import {NativeModules} from 'react-native';

interface DirectSmsNative {
  sendSms(phone: string, message: string, subscriptionId: number | null): Promise<{resultCode: number; parts: number}>;
  getSimCards(): Promise<SimCard[]>;
  isIgnoringBatteryOptimizations(): Promise<boolean>;
  requestIgnoreBatteryOptimizations(): Promise<boolean>;
}

const native: DirectSmsNative | undefined = NativeModules.DirectSms;

export interface SmsSendResult {
  status: 'SENT' | 'FAILED';
  failReason?: string;
  providerResponse?: Record<string, unknown>;
}

export interface SimCard {
  subscriptionId: number;
  slotIndex: number;
  carrierName: string;
  displayName: string;
}

export async function getSimCards(): Promise<SimCard[]> {
  if (!native) return [];
  return native.getSimCards();
}

/**
 * Sends one SMS via the native module. Never throws — failures are returned as a
 * FAILED result with a short `failReason`, so the worker can always report.
 */
export async function sendSms(
  phone: string,
  message: string,
  subscriptionId?: number,
): Promise<SmsSendResult> {
  if (!native) {
    return {status: 'FAILED', failReason: 'native_module_missing'};
  }
  try {
    const res = await native.sendSms(phone, message, subscriptionId ?? null);
    return {
      status: 'SENT',
      providerResponse: {resultCode: res.resultCode, parts: res.parts, subscriptionId: subscriptionId ?? null},
    };
  } catch (e: any) {
    // Native promise rejections surface as { code, message }.
    const failReason = e?.code ? String(e.code) : 'send_error';
    return {
      status: 'FAILED',
      failReason,
      providerResponse: {code: e?.code ?? null, message: e?.message ?? null},
    };
  }
}

export async function isIgnoringBatteryOptimizations(): Promise<boolean> {
  if (!native) {
    return true;
  }
  try {
    return await native.isIgnoringBatteryOptimizations();
  } catch {
    return true;
  }
}

export async function requestIgnoreBatteryOptimizations(): Promise<void> {
  if (!native) {
    return;
  }
  try {
    await native.requestIgnoreBatteryOptimizations();
  } catch {
    // Ignored — the settings screen simply may not have opened.
  }
}
