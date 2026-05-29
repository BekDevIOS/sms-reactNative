import {
  AuthResponse,
  ClaimResponse,
  CreateDeviceBody,
  DeviceCreated,
  DevicesList,
  HeartbeatBody,
  HeartbeatResponse,
  Job,
  LoginBody,
  RegisterBody,
  ReportBody,
  ReportResponse,
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

const DEFAULT_TIMEOUT_MS = 15000;

function joinUrl(base: string, path: string): string {
  return base.replace(/\/+$/, '') + path;
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
}
