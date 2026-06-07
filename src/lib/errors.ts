import {ApiError, InvalidCredentialsError, UnauthorizedError} from '../api/client';

/** Best-effort human message from any thrown error. */
export function errorMessage(e: unknown, fallback = 'Xatolik yuz berdi'): string {
  if (e instanceof InvalidCredentialsError) {
    return 'Email yoki parol noto‘g‘ri';
  }
  if (e instanceof UnauthorizedError) {
    return 'Sessiya tugadi. Qaytadan kiring.';
  }
  if (e instanceof ApiError) {
    return e.message || fallback;
  }
  if (e instanceof Error && e.message) {
    return e.message;
  }
  return fallback;
}
