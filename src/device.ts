import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';

/** Battery level as an integer 0–100 (0 if unknown). */
export async function getBatteryLevel(): Promise<number> {
  try {
    const lvl = await DeviceInfo.getBatteryLevel(); // 0..1, or -1 if unknown
    return lvl < 0 ? 0 : Math.round(lvl * 100);
  } catch {
    return 0;
  }
}

export function getAppVersion(): string {
  try {
    return DeviceInfo.getVersion();
  } catch {
    return '1.0.0';
  }
}

/** Coarse network type label: WIFI | CELLULAR | ETHERNET | NONE | UNKNOWN. */
export async function getNetworkType(): Promise<string> {
  try {
    const s = await NetInfo.fetch();
    if (s.isConnected === false) {
      return 'NONE';
    }
    switch (s.type) {
      case 'wifi':
        return 'WIFI';
      case 'cellular':
        return 'CELLULAR';
      case 'ethernet':
        return 'ETHERNET';
      case 'none':
        return 'NONE';
      default:
        return s.type ? s.type.toUpperCase() : 'UNKNOWN';
    }
  } catch {
    return 'UNKNOWN';
  }
}
