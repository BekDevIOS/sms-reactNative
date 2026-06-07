// Uzbek display labels + status → pill-tone mappings for all enums.
import type {
  AutoReplyMatchType,
  CampaignStatus,
  ContactStatus,
  DeviceStatus,
  MemberRole,
  MemberStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  SmsLogStatus,
} from '../api/types';
import {colors} from '../theme';

export type PillTone = 'success' | 'warn' | 'danger' | 'neutral' | 'accent';

/** Pill background + text colors per tone, for the StatusPill component. */
export const pillColors: Record<PillTone, {bg: string; text: string}> = {
  success: {bg: 'rgba(34,197,94,0.18)', text: colors.success},
  warn: {bg: 'rgba(245,158,11,0.18)', text: colors.warning},
  danger: {bg: 'rgba(239,68,68,0.18)', text: colors.danger},
  neutral: {bg: 'rgba(139,147,163,0.18)', text: colors.muted},
  accent: {bg: 'rgba(59,130,246,0.18)', text: colors.primary},
};

export const campaignStatusLabel: Record<CampaignStatus, string> = {
  DRAFT: 'Qoralama',
  SCHEDULED: 'Rejalashtirilgan',
  SENDING: 'Yuborilmoqda',
  DONE: 'Yakunlangan',
};
export const campaignStatusTone: Record<CampaignStatus, PillTone> = {
  DRAFT: 'neutral',
  SCHEDULED: 'accent',
  SENDING: 'warn',
  DONE: 'success',
};

export const deviceStatusLabel: Record<DeviceStatus, string> = {
  ONLINE: 'Onlayn',
  OFFLINE: 'Oflayn',
  BLOCKED: 'Bloklangan',
};
export const deviceStatusTone: Record<DeviceStatus, PillTone> = {
  ONLINE: 'success',
  OFFLINE: 'neutral',
  BLOCKED: 'danger',
};

export const contactStatusLabel: Record<ContactStatus, string> = {
  ACTIVE: 'Faol',
  ARCHIVED: 'Arxivlangan',
};
export const contactStatusTone: Record<ContactStatus, PillTone> = {
  ACTIVE: 'success',
  ARCHIVED: 'neutral',
};

export const memberStatusLabel: Record<MemberStatus, string> = {
  ACTIVE: 'Faol',
  BLOCKED: 'Bloklangan',
  DELETED: "O'chirilgan",
};
export const memberStatusTone: Record<MemberStatus, PillTone> = {
  ACTIVE: 'success',
  BLOCKED: 'danger',
  DELETED: 'neutral',
};

export const memberRoleLabel: Record<MemberRole, string> = {
  OWNER: 'Egasi',
  ADMIN: 'Administrator',
  USER: 'Foydalanuvchi',
};

export const subscriptionStatusLabel: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Faol',
  EXPIRED: 'Muddati tugagan',
  CANCELLED: 'Bekor qilingan',
};
export const subscriptionStatusTone: Record<SubscriptionStatus, PillTone> = {
  ACTIVE: 'success',
  EXPIRED: 'warn',
  CANCELLED: 'danger',
};

export const subscriptionPlanLabel: Record<SubscriptionPlan, string> = {
  BASIC: 'Basic',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};

export const smsLogStatusLabel: Record<SmsLogStatus, string> = {
  SENT: 'Yuborildi',
  FAILED: 'Xato',
  DELIVERED: 'Yetkazildi',
};
export const smsLogStatusTone: Record<SmsLogStatus, PillTone> = {
  SENT: 'success',
  FAILED: 'danger',
  DELIVERED: 'accent',
};

export const autoReplyMatchLabel: Record<AutoReplyMatchType, string> = {
  EXACT: 'Aniq mos',
  CONTAINS: 'Ichida bor',
  PREFIX: 'Boshlanishi',
};
