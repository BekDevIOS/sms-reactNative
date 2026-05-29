import {NativeModules} from 'react-native';

interface DirectSmsNative {
  sendSms(phone: string, message: string): Promise<{resultCode: number; parts: number}>;
  isIgnoringBatteryOptimizations(): Promise<boolean>;
  requestIgnoreBatteryOptimizations(): Promise<boolean>;
}

const native: DirectSmsNative | undefined = NativeModules.DirectSms;

export interface SmsSendResult {
  status: 'SENT' | 'FAILED';
  failReason?: string;
  providerResponse?: Record<string, unknown>;
}

/**
 * Sends one SMS via the native module. Never throws — failures are returned as a
 * FAILED result with a short `failReason`, so the worker can always report.
 */
export async function sendSms(phone: string, message: string): Promise<SmsSendResult> {
  if (!native) {
    return {status: 'FAILED', failReason: 'native_module_missing'};
  }
  try {
    const res = await native.sendSms(phone, message);
    return {
      status: 'SENT',
      providerResponse: {resultCode: res.resultCode, parts: res.parts},
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
