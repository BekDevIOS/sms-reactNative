// Types mirroring the NestJS backend contract (apps/api).

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'BLOCKED';
export type ReportStatus = 'SENT' | 'FAILED';
export type DevicePlatform = 'ANDROID' | 'IOS';

// ---- Auth (member) ----

export interface LoginBody {
  memberEmail: string;
  memberPassword: string;
}

export interface RegisterBody {
  memberEmail: string;
  memberPassword: string;
  memberFirstName: string;
  memberLastName?: string;
  memberPhone?: string;
  memberCompanyName?: string;
}

export interface Member {
  _id: string;
  memberEmail: string;
  memberFirstName: string;
  memberLastName?: string;
  memberCompanyName?: string;
  memberDevices: number;
  memberRole: string;
  memberStatus: string;
}

export interface AuthResponse {
  token: string;
  member: Member;
}

// ---- Member-facing device management ----

export interface CreateDeviceBody {
  name: string;
  platform?: DevicePlatform;
  phone?: string;
}

/** A device row as returned to the member from GET /device. Includes its pairing code. */
export interface DeviceSummary {
  _id: string;
  name: string;
  code: string;
  status: DeviceStatus;
  platform?: DevicePlatform;
  phone?: string;
  sendLimitPerMinute: number;
  batteryLevel?: number;
  networkType?: string;
  lastSeenAt?: string;
}

export interface DevicesList {
  list: DeviceSummary[];
  total: number;
}

export interface DeviceCreated {
  deviceId: string;
  code: string;
  name: string;
  status: DeviceStatus;
}

// ---- Device-facing (worker) ----

export interface ClaimResponse {
  token: string;
  device: {
    deviceId: string;
    name: string;
    sendLimitPerMinute: number;
  };
}

export interface HeartbeatBody {
  status: DeviceStatus;
  batteryLevel?: number;
  networkType?: string;
  appVersion?: string;
}

export interface HeartbeatResponse {
  _id: string;
  status: DeviceStatus;
  lastSeenAt?: string;
  batteryLevel?: number;
}

export interface Job {
  recipientId: string;
  campaignId: string;
  phone: string;
  message: string;
}

export interface ReportBody {
  recipientId: string;
  status: ReportStatus;
  failReason?: string | null;
  providerResponse?: Record<string, unknown> | null;
}

export interface ReportResponse {
  success: boolean;
}
