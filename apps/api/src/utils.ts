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

export function createEventApplicationId() {
  return `app_${nanoid(10)}`;
}

export function createTicketId() {
  return `tkt_${nanoid(12)}`;
}

export function createFriendRequestId() {
  return `fr_${nanoid(10)}`;
}

export function createRazorpayOrderId() {
  return `order_${nanoid(14)}`;
}

export function createIntakeId() {
  return `intake_${nanoid(10)}`;
}

export function sixDigitOtp() {
  return numericOtp();
}

export function addMinutes(isoDate: string, minutes: number) {
  const date = new Date(isoDate);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

export function addDays(isoDate: string, days: number) {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
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

export function formatPriceLabel(priceCents: number, currency: "INR") {
  if (priceCents <= 0) {
    return "Free";
  }

  const amount = priceCents / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function startOfUtcDay(isoDate: string) {
  const date = new Date(isoDate);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
}
