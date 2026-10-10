// Types mirroring the NestJS backend contract (sms-tezkor).
// Worker-facing types live here alongside the full domain models ported from the
// web frontend (SMS-Frontend/sms-frontend/src/types).

// ---- enums ----

export type MemberRole = 'OWNER' | 'ADMIN' | 'USER';
export type MemberStatus = 'ACTIVE' | 'BLOCKED' | 'DELETED';
export type MemberAuthType = 'EMAIL' | 'PHONE';

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'BLOCKED';
export type DevicePlatform = 'ANDROID' | 'IOS';

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'DONE';
export type CampaignRecipientStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';

export type ContactStatus = 'ACTIVE' | 'ARCHIVED';

export type SubscriptionPlan = 'BASIC' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export type SmsLogStatus = 'SENT' | 'FAILED' | 'DELIVERED';
export type ReportStatus = 'SENT' | 'FAILED';

export type TemplateStatus = 'ACTIVE' | 'ARCHIVED';

export type AutoReplyMatchType = 'EXACT' | 'CONTAINS' | 'PREFIX';
export type AutoReplyStatus = 'ACTIVE' | 'ARCHIVED';

export type Direction = 'asc' | 'desc';

// ---- common ----

/** Standard list envelope returned by every backend list endpoint. */
export interface ListResponse<T> {
  list: T[];
  total: number;
}

/** Query params shared by every *Inquiry endpoint. */
export interface InquiryParams {
  page: number;
  limit: number;
  sort?: string;
  direction?: Direction;
  status?: string;
  search?: Record<string, string | number | boolean | undefined>;
}

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

export interface UpdateMeBody {
  memberFirstName?: string;
  memberLastName?: string;
  memberPhone?: string;
  memberCompanyName?: string;
  memberImage?: string;
}

export interface Member {
  _id: string;
  memberStatus: MemberStatus;
  memberRole: MemberRole;
  memberAuthType?: MemberAuthType;
  memberEmail: string;
  memberPhone?: string;
  memberFirstName: string;
  memberLastName?: string;
  memberCompanyName?: string;
  memberImage?: string;
  memberDevices: number;
  memberContacts?: number;
  memberCampaigns?: number;
  memberSentSms?: number;
  memberFailedSms?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  member: Member;
}

// ---- Devices ----

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
  pairedAt?: string;
  simSubscriptionId?: number;
  simSlotIndex?: number;
  simCarrier?: string;
  sendLimitPerMinute: number;
  batteryLevel?: number;
  networkType?: string;
  lastSeenAt?: string;
}

export interface DevicesList {
  list: DeviceSummary[];
  total: number;
}

export interface Device {
  _id: string;
  memberId: string;
  code: string;
  name: string;
  status: DeviceStatus;
  platform?: DevicePlatform;
  phone?: string;
  carrier?: string;
  simSubscriptionId?: number;
  simSlotIndex?: number;
  simCarrier?: string;
  networkType?: string;
  batteryLevel?: number;
  appVersion?: string;
  lastSeenAt?: string;
  pairedAt?: string;
  currentLoad?: number;
  sendLimitPerMinute: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceCreated {
  deviceId: string;
  code: string;
  name: string;
  status: DeviceStatus;
}

// ---- Campaigns ----

export interface CreateCampaignBody {
  title: string;
  message: string;
  scheduledAt?: string;
  sendNow?: boolean;
  deviceId?: string;
  contactIds?: string[];
  groupIds?: string[];
  phones?: string[];
}

export interface Campaign {
  _id: string;
  memberId: string;
  title: string;
  message: string;
  senderDeviceId?: string;
  status: CampaignStatus;
  scheduledAt?: string;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignProgress {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
}

export interface CampaignDetail extends Campaign {
  progress: CampaignProgress;
}

// ---- Contacts ----

export interface CreateContactBody {
  name?: string;
  phone: string;
  status?: ContactStatus;
  tags?: string[];
  groupIds?: string[];
}
export type UpdateContactBody = Partial<CreateContactBody>;

export interface ImportContactsResult {
  created: number;
  updated: number;
  errors: {row: number; phone: string; reason: string}[];
}

export interface Contact {
  _id: string;
  memberId: string;
  name?: string;
  phone: string;
  status: ContactStatus;
  tags: string[];
  groupIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactGroupBody {
  name: string;
  description?: string;
  color?: string;
}

export interface ContactGroup {
  _id: string;
  memberId: string;
  name: string;
  description?: string;
  color: string;
  count?: number;
  createdAt: string;
  updatedAt: string;
}

// ---- Subscription / Plans ----

export interface Subscription {
  _id: string;
  memberId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startsAt: string;
  expiresAt?: string;
  deviceLimit?: number | null;
  dailySmsLimit?: number | null;
  note?: string;
  activatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivateSubscriptionBody {
  plan: SubscriptionPlan;
  durationDays?: number;
  deviceLimit?: number;
  dailySmsLimit?: number;
  note?: string;
}

export interface Plan {
  _id: string;
  code: SubscriptionPlan;
  name: string;
  price: number | null;
  currency: string;
  dailySmsLimit: number | null;
  deviceLimit: number | null;
  durationDays: number | null;
  description: string;
  features: string[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePlanBody {
  name?: string;
  price?: number | null;
  currency?: string;
  dailySmsLimit?: number | null;
  deviceLimit?: number | null;
  durationDays?: number | null;
  description?: string;
  features?: string[];
  order?: number;
  isActive?: boolean;
}

// ---- SMS logs ----

export interface SmsLog {
  _id: string;
  memberId?: string;
  deviceId?: string;
  campaignId?: string;
  contactId?: string;
  phone?: string;
  message?: string;
  status: SmsLogStatus;
  providerResponse?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---- Templates ----

export interface CreateTemplateBody {
  name: string;
  body: string;
  variables?: string[];
  locale?: string;
  status?: TemplateStatus;
}
export type UpdateTemplateBody = Partial<CreateTemplateBody>;

export interface Template {
  _id: string;
  memberId: string;
  name: string;
  body: string;
  variables: string[];
  locale?: string;
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string;
}

// ---- Auto reply ----

export interface CreateAutoReplyBody {
  triggerText: string;
  replyBody: string;
  matchType?: AutoReplyMatchType;
  enabled?: boolean;
  deviceId?: string;
  status?: AutoReplyStatus;
}
export type UpdateAutoReplyBody = Partial<CreateAutoReplyBody>;

export interface AutoReply {
  _id: string;
  memberId: string;
  triggerText: string;
  replyBody: string;
  matchType: AutoReplyMatchType;
  enabled: boolean;
  deviceId?: string;
  status: AutoReplyStatus;
  createdAt: string;
  updatedAt: string;
}

// ---- Members (admin) ----

export interface AdminUpdateMemberBody {
  memberStatus?: MemberStatus;
  memberRole?: MemberRole;
}

// ---- Stats ----

export interface CampaignCounts {
  draft: number;
  scheduled: number;
  sending: number;
  done: number;
  total: number;
}

export interface DeviceCounts {
  online: number;
  offline: number;
  blocked: number;
  total: number;
}

export interface SmsCounts {
  sent: number;
  failed: number;
  delivered: number;
}

export interface SmsSeriesPoint {
  date: string;
  sent: number;
  failed: number;
}

export interface MemberStats {
  campaigns: CampaignCounts;
  devices: DeviceCounts;
  sms: SmsCounts;
  smsSeries: SmsSeriesPoint[];
}

export interface MemberCounts {
  active: number;
  blocked: number;
  deleted: number;
  total: number;
}

export interface AdminStats {
  members: MemberCounts;
  campaigns: CampaignCounts;
  devicesOnline: number;
  sms: SmsCounts;
  subscriptions: {
    byPlan: {BASIC: number; PRO: number; ENTERPRISE: number};
    byStatus: {ACTIVE: number; EXPIRED: number; CANCELLED: number};
  };
  smsSeries: SmsSeriesPoint[];
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
  simSubscriptionId?: number;
  simSlotIndex?: number;
  simCarrier?: string;
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
