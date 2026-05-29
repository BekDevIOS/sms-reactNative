import {Permission, PermissionsAndroid, Platform} from 'react-native';

export interface CorePermissionResult {
  sms: boolean;
  phone: boolean;
  notifications: boolean;
}

export async function hasSendSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS);
}

/**
 * Requests SEND_SMS + READ_PHONE_STATE (and POST_NOTIFICATIONS on API 33+).
 * Returns which were granted; callers decide how to react.
 */
export async function requestCorePermissions(): Promise<CorePermissionResult> {
  if (Platform.OS !== 'android') {
    return {sms: false, phone: false, notifications: false};
  }

  const perms: Permission[] = [
    PermissionsAndroid.PERMISSIONS.SEND_SMS,
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
  ];
  const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : 0;
  if (apiLevel >= 33) {
    perms.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }

  const result = await PermissionsAndroid.requestMultiple(perms);
  const isGranted = (p: Permission) => result[p] === PermissionsAndroid.RESULTS.GRANTED;

  return {
    sms: isGranted(PermissionsAndroid.PERMISSIONS.SEND_SMS),
    phone: isGranted(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE),
    notifications:
      apiLevel >= 33 ? isGranted(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) : true,
  };
}
