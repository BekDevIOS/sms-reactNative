import {
  ActivateSubscriptionBody,
  AdminStats,
  AdminUpdateMemberBody,
  AuthResponse,
  AutoReply,
  Campaign,
  CampaignDetail,
  ClaimResponse,
  Contact,
  ContactGroup,
  ContactGroupBody,
  CreateAutoReplyBody,
  CreateCampaignBody,
  CreateContactBody,
  CreateDeviceBody,
  CreateTemplateBody,
  Device,
  DeviceCreated,
  DevicesList,
  HeartbeatBody,
  HeartbeatResponse,
  ImportContactsResult,
  InquiryParams,
  Job,
  ListResponse,
  LoginBody,
  Member,
  MemberStats,
  Plan,
  RegisterBody,
  ReportBody,
  ReportResponse,
  SmsLog,
  Subscription,
  SubscriptionPlan,
  Template,
  UpdateAutoReplyBody,
  UpdateContactBody,
  UpdateMeBody,
  UpdatePlanBody,
  UpdateTemplateBody,
} from './types';

/** A Bearer-authenticated call returned HTTP 401 — the token is invalid/expired. */
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized (401)') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/** Wrong email/password on /auth/login. */
export class InvalidCredentialsError extends Error {
  constructor(message = 'Wrong email or password') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

/** /device/claim rejected the pairing code (HTTP 401). */
export class InvalidCodeError extends Error {
  constructor(message = 'Invalid or expired pairing code') {
    super(message);
    this.name = 'InvalidCodeError';
  }
}

/** Member hit their subscription device cap on POST /device (HTTP 403). */
export class DeviceLimitError extends Error {
  constructor(message = 'Device limit reached') {
    super(message);
    this.name = 'DeviceLimitError';
  }
}

/** Generic non-2xx / network error. `status` is the HTTP code when available. */
export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** A Bearer-authenticated call returned HTTP 403 — not allowed (e.g. non-admin). */
export class ForbiddenError extends Error {
  constructor(message = 'Forbidden (403)') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

function joinUrl(base: string, path: string): string {
  return base.replace(/\/+$/, '') + path;
}

/**
 * Serializes InquiryParams the way the frontend's axios `params` would: scalar
 * fields as `key=value`, and nested `search.*` flattened to `search[key]=value`.
 */
export function buildQuery(params?: InquiryParams | Record<string, unknown>): string {
  if (!params) {
    return '';
  }
  const parts: string[] = [];
  const add = (k: string, v: unknown) => {
    if (v === undefined || v === null || v === '') {
      return;
    }
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  };
  for (const [key, value] of Object.entries(params)) {
    if (key === 'search' && value && typeof value === 'object') {
      for (const [sk, sv] of Object.entries(value as Record<string, unknown>)) {
        add(`search[${sk}]`, sv);
      }
    } else {
      add(key, value);
    }
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

/** Pulls the human message out of the backend error body `{ message, ... }`. */
function messageFromBody(text: string): string | null {
  if (!text) {
    return null;
  }
  try {
    const body = JSON.parse(text);
    if (body && typeof body.message === 'string') {
      return body.message;
    }
  } catch {
    // not JSON
  }
  return text;
}

interface RequestOptions {
  method: 'GET' | 'POST';
  token?: string | null;
  body?: unknown;
  timeoutMs?: number;
}

async function request<T>(baseUrl: string, path: string, opts: RequestOptions): Promise<T> {
  const {method, token, body, timeoutMs = DEFAULT_TIMEOUT_MS} = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = {'Content-Type': 'application/json'};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(joinUrl(baseUrl, path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (res.status === 401) {
      throw new UnauthorizedError();
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ApiError(messageFromBody(text) ?? `HTTP ${res.status}`, res.status);
    }
    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Client for the backend. Construct with a base URL + token; the same class serves
 * both the member token (device management, logout) and the device token (worker
 * endpoints) — you just pass whichever token applies. Token-free calls are static.
 */
export class ApiClient {
  constructor(private baseUrl: string, private token: string | null = null) {}

  setToken(token: string | null): void {
    this.token = token;
  }

  // ---- Auth (no token) ----

  /** POST /auth/login → { token, member }. 401 → InvalidCredentialsError. */
  static async login(baseUrl: string, body: LoginBody): Promise<AuthResponse> {
    try {
      return await request<AuthResponse>(baseUrl, '/auth/login', {method: 'POST', body});
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        throw new InvalidCredentialsError();
      }
      throw e;
    }
  }

  /** POST /auth/register → { token, member }. */
  static register(baseUrl: string, body: RegisterBody): Promise<AuthResponse> {
    return request<AuthResponse>(baseUrl, '/auth/register', {method: 'POST', body});
  }

  /** POST /device/claim → { token, device }. 401 → InvalidCodeError. */
  static async claim(baseUrl: string, code: string): Promise<ClaimResponse> {
    try {
      return await request<ClaimResponse>(baseUrl, '/device/claim', {
        method: 'POST',
        body: {code},
      });
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        throw new InvalidCodeError();
      }
      throw e;
    }
  }

  // ---- Member-facing (member token) ----

  /** POST /auth/logout. */
  logout(): Promise<{success: boolean}> {
    return request<{success: boolean}>(this.baseUrl, '/auth/logout', {
      method: 'POST',
      token: this.token,
    });
  }

  /** GET /device → the member's devices. */
  listDevices(): Promise<DevicesList> {
    return request<DevicesList>(this.baseUrl, '/device', {method: 'GET', token: this.token});
  }

  /** POST /device → create a device slot. 403 → DeviceLimitError. */
  async createDevice(body: CreateDeviceBody): Promise<DeviceCreated> {
    try {
      return await request<DeviceCreated>(this.baseUrl, '/device', {
        method: 'POST',
        token: this.token,
        body,
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        throw new DeviceLimitError(e.message);
      }
      throw e;
    }
  }

  // ---- Device-facing (device token) ----

  /** POST /device/heartbeat */
  heartbeat(body: HeartbeatBody): Promise<HeartbeatResponse> {
    return request<HeartbeatResponse>(this.baseUrl, '/device/heartbeat', {
      method: 'POST',
      token: this.token,
      body,
    });
  }

  /** GET /device/jobs?limit=N */
  pollJobs(limit: number): Promise<Job[]> {
    return request<Job[]>(
      this.baseUrl,
      `/device/jobs?limit=${encodeURIComponent(String(limit))}`,
      {method: 'GET', token: this.token},
    );
  }

  /** POST /device/report — success:false means duplicate/late (already handled). */
  report(body: ReportBody): Promise<ReportResponse> {
    return request<ReportResponse>(this.baseUrl, '/device/report', {
      method: 'POST',
      token: this.token,
      body,
    });
  }

  // ---- Generic member-token helpers ----

  get<T>(path: string, params?: InquiryParams | Record<string, unknown>): Promise<T> {
    return request<T>(this.baseUrl, path + buildQuery(params), {
      method: 'GET',
      token: this.token,
    });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(this.baseUrl, path, {method: 'POST', token: this.token, body});
  }

  // ---- Member / profile ----

  getMe(): Promise<Member> {
    return this.get<Member>('/member/me');
  }
  updateMe(body: UpdateMeBody): Promise<Member> {
    return this.post<Member>('/member/me', body);
  }

  // ---- Stats ----

  getMyStats(days?: number): Promise<MemberStats> {
    return this.get<MemberStats>('/stats/me', days ? {days} : undefined);
  }
  getAdminStats(days?: number): Promise<AdminStats> {
    return this.get<AdminStats>('/admin/stats', days ? {days} : undefined);
  }

  // ---- Templates ----

  getTemplates(params: InquiryParams): Promise<ListResponse<Template>> {
    return this.get<ListResponse<Template>>('/template', params);
  }
  createTemplate(body: CreateTemplateBody): Promise<Template> {
    return this.post<Template>('/template', body);
  }
  updateTemplate(id: string, body: UpdateTemplateBody): Promise<Template> {
    return this.post<Template>(`/template/${id}`, body);
  }
  deleteTemplate(id: string): Promise<{success: boolean}> {
    return this.post<{success: boolean}>(`/template/${id}/delete`);
  }

  // ---- Contacts ----

  getContacts(params: InquiryParams): Promise<ListResponse<Contact>> {
    return this.get<ListResponse<Contact>>('/contact', params);
  }
  createContact(body: CreateContactBody): Promise<Contact> {
    return this.post<Contact>('/contact', body);
  }
  updateContact(id: string, body: UpdateContactBody): Promise<Contact> {
    return this.post<Contact>(`/contact/${id}`, body);
  }
  deleteContact(id: string): Promise<{success: boolean}> {
    return this.post<{success: boolean}>(`/contact/${id}/delete`);
  }
  importContacts(rows: CreateContactBody[]): Promise<ImportContactsResult> {
    return this.post<ImportContactsResult>('/contact/import', {contacts: rows});
  }

  // ---- Contact groups ----

  getContactGroups(): Promise<ContactGroup[]> {
    return this.get<ContactGroup[]>('/contact-group');
  }
  createContactGroup(body: ContactGroupBody): Promise<ContactGroup> {
    return this.post<ContactGroup>('/contact-group', body);
  }
  updateContactGroup(id: string, body: ContactGroupBody): Promise<ContactGroup> {
    return this.post<ContactGroup>(`/contact-group/${id}`, body);
  }
  deleteContactGroup(id: string): Promise<{success: boolean}> {
    return this.post<{success: boolean}>(`/contact-group/${id}/delete`);
  }

  // ---- Auto reply ----

  getAutoReplies(params: InquiryParams): Promise<ListResponse<AutoReply>> {
    return this.get<ListResponse<AutoReply>>('/auto-reply', params);
  }
  createAutoReply(body: CreateAutoReplyBody): Promise<AutoReply> {
    return this.post<AutoReply>('/auto-reply', body);
  }
  updateAutoReply(id: string, body: UpdateAutoReplyBody): Promise<AutoReply> {
    return this.post<AutoReply>(`/auto-reply/${id}`, body);
  }
  deleteAutoReply(id: string): Promise<{success: boolean}> {
    return this.post<{success: boolean}>(`/auto-reply/${id}/delete`);
  }

  // ---- Campaigns ----

  getCampaigns(params: InquiryParams): Promise<ListResponse<Campaign>> {
    return this.get<ListResponse<Campaign>>('/campaign', params);
  }
  getCampaign(id: string): Promise<CampaignDetail> {
    return this.get<CampaignDetail>(`/campaign/${id}`);
  }
  createCampaign(body: CreateCampaignBody): Promise<CampaignDetail | Campaign> {
    return this.post<CampaignDetail | Campaign>('/campaign', body);
  }
  cancelCampaign(id: string): Promise<CampaignDetail> {
    return this.post<CampaignDetail>(`/campaign/${id}/cancel`);
  }

  // ---- SMS logs ----

  getSmsLogs(params: InquiryParams): Promise<ListResponse<SmsLog>> {
    return this.get<ListResponse<SmsLog>>('/sms-log', params);
  }
  getAdminSmsLogs(params: InquiryParams): Promise<ListResponse<SmsLog>> {
    return this.get<ListResponse<SmsLog>>('/admin/sms-log', params);
  }

  // ---- Subscription / plans ----

  getMySubscription(): Promise<Subscription | null> {
    return this.get<Subscription | null>('/subscription/me');
  }
  getPlans(): Promise<Plan[]> {
    return this.get<Plan[]>('/plan');
  }
  getAdminPlans(): Promise<Plan[]> {
    return this.get<Plan[]>('/admin/plan');
  }
  updatePlan(code: SubscriptionPlan, body: UpdatePlanBody): Promise<Plan> {
    return this.post<Plan>(`/admin/plan/${code}`, body);
  }
  getAdminSubscriptions(params: InquiryParams): Promise<ListResponse<Subscription>> {
    return this.get<ListResponse<Subscription>>('/admin/subscription', params);
  }
  activateSubscription(memberId: string, body: ActivateSubscriptionBody): Promise<Subscription> {
    return this.post<Subscription>(`/admin/subscription/member/${memberId}`, body);
  }
  cancelSubscription(id: string): Promise<Subscription> {
    return this.post<Subscription>(`/admin/subscription/${id}/cancel`);
  }

  // ---- Members (admin) ----

  getMembers(params: InquiryParams): Promise<ListResponse<Member>> {
    return this.get<ListResponse<Member>>('/admin/member', params);
  }
  getMember(id: string): Promise<Member> {
    return this.get<Member>(`/admin/member/${id}`);
  }
  updateMember(id: string, body: AdminUpdateMemberBody): Promise<Member> {
    return this.post<Member>(`/admin/member/${id}`, body);
  }
  deleteMember(id: string): Promise<{success: boolean}> {
    return this.post<{success: boolean}>(`/admin/member/${id}/delete`);
  }

  // ---- Devices (member-token, full management) ----

  getDevices(params?: InquiryParams): Promise<ListResponse<Device>> {
    return this.get<ListResponse<Device>>('/device', params);
  }
  resetDeviceCode(id: string): Promise<DeviceCreated> {
    return this.post<DeviceCreated>(`/device/${id}/reset-code`);
  }
  revokeDevice(id: string): Promise<{success: boolean}> {
    return this.post<{success: boolean}>(`/device/${id}/revoke`);
  }
}
