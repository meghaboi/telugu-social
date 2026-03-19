import { customAlphabet, nanoid } from "nanoid";
import { ThemePreference } from "./types.js";

const numericOtp = customAlphabet("0123456789", 6);

export function nowIso() {
  return new Date().toISOString();
}

export function createUserId() {
  return `u_${nanoid(10)}`;
}

export function createSessionToken() {
  return `ts_${nanoid(24)}`;
}

export function createOtpToken() {
  return `otp_${nanoid(16)}`;
}

export function createNotificationId() {
  return `notif_${nanoid(10)}`;
}

export function sixDigitOtp() {
  return numericOtp();
}

export function addMinutes(isoDate: string, minutes: number) {
  const date = new Date(isoDate);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

export function isAtLeast14(dobIsoDate: string, now = new Date()) {
  const dob = new Date(dobIsoDate);
  if (Number.isNaN(dob.getTime())) {
    return false;
  }

  const minDate = new Date(now);
  minDate.setFullYear(now.getFullYear() - 14);
  return dob <= minDate;
}

export function normalizeThemePreference(theme?: ThemePreference) {
  return theme ?? "system";
}
