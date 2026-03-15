import { customAlphabet, nanoid } from "nanoid";
import { Event, EventRsvp, Invite, ModerationReport, OtpRequest, Session, User } from "./types.js";

const inviteCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

const nowIso = () => new Date().toISOString();

export const users: User[] = [
  {
    id: "u_owner",
    phone: "+919900000001",
    name: "Launch Admin",
    username: "launchadmin",
    profilePicture: "",
    pronouns: "they/them",
    description: "Seed account",
    city: "Hyderabad",
    inviteLimit: 5,
    inviteCountUsed: 1,
    friends: ["u_friend1", "u_friend2"],
    createdAt: nowIso(),
  },
  {
    id: "u_friend1",
    phone: "+919900000002",
    name: "Rohit",
    username: "rohit_hyd",
    profilePicture: "",
    pronouns: "he/him",
    description: "Community volunteer",
    city: "Hyderabad",
    inviteLimit: 5,
    inviteCountUsed: 0,
    friends: ["u_owner"],
    createdAt: nowIso(),
  },
  {
    id: "u_friend2",
    phone: "+919900000003",
    name: "Madhavi",
    username: "madhavi_runs",
    profilePicture: "",
    pronouns: "she/her",
    description: "Amateur host",
    city: "Hyderabad",
    inviteLimit: 5,
    inviteCountUsed: 0,
    friends: ["u_owner"],
    createdAt: nowIso(),
  },
];

export const invites: Invite[] = [
  {
    code: "WELCOME01",
    inviterId: "u_owner",
    createdAt: nowIso(),
  },
  {
    code: "FRIEND002",
    inviterId: "u_owner",
    createdAt: nowIso(),
  },
];

export const events: Event[] = [
  {
    id: "evt_1",
    title: "Sunday Charminar Walk",
    description: "Friends-only heritage walk ending with breakfast.",
    city: "Hyderabad",
    location: "Charminar Metro Exit",
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    type: "amateur",
    hostId: "u_friend2",
    tags: ["walk", "heritage", "morning"],
    updates: [
      { id: nanoid(), message: "Route map posted.", createdAt: nowIso() },
      { id: nanoid(), message: "Bring water and cap.", createdAt: nowIso() },
    ],
  },
  {
    id: "evt_2",
    title: "Lake Cleanup Drive",
    description: "Volunteer drive with safety briefing and cleanup kit.",
    city: "Hyderabad",
    location: "Durgam Cheruvu Park Gate",
    startsAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    type: "volunteer",
    hostId: "u_friend1",
    tags: ["volunteer", "environment"],
    updates: [{ id: nanoid(), message: "Gloves and bags arranged.", createdAt: nowIso() }],
  },
  {
    id: "evt_3",
    title: "Indie Music Night",
    description: "Verified indoor live set with local artists.",
    city: "Hyderabad",
    location: "Jubilee Hills, Venue TBA",
    startsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    type: "verified",
    hostId: "u_owner",
    tags: ["music", "nightlife"],
    updates: [{ id: nanoid(), message: "Final lineup drops tonight.", createdAt: nowIso() }],
  },
];

export const rsvps: EventRsvp[] = [
  { userId: "u_owner", eventId: "evt_1", intent: "going", updatedAt: nowIso() },
  { userId: "u_friend1", eventId: "evt_2", intent: "going", updatedAt: nowIso() },
  { userId: "u_friend2", eventId: "evt_1", intent: "going", updatedAt: nowIso() },
];

export const otpRequests: OtpRequest[] = [];
export const sessions: Session[] = [];
export const moderationReports: ModerationReport[] = [];

export function createInviteCode() {
  return inviteCode();
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

export function sixDigitOtp() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

export function findUserByToken(token: string) {
  const session = sessions.find((s) => s.token === token);
  if (!session) {
    return null;
  }
  return users.find((u) => u.id === session.userId) ?? null;
}