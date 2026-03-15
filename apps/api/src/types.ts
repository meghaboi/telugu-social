export type RsvpIntent = "going" | "interested" | "not_going";

export type User = {
  id: string;
  phone: string;
  name: string;
  username: string;
  profilePicture: string;
  pronouns: string;
  description: string;
  city: string;
  inviteLimit: number;
  inviteCountUsed: number;
  friends: string[];
  createdAt: string;
};

export type Invite = {
  code: string;
  inviterId: string;
  inviteeId?: string;
  usedAt?: string;
  createdAt: string;
};

export type EventUpdate = {
  id: string;
  message: string;
  createdAt: string;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  city: string;
  location: string;
  startsAt: string;
  type: "amateur" | "verified" | "volunteer";
  hostId: string;
  tags: string[];
  updates: EventUpdate[];
};

export type EventRsvp = {
  userId: string;
  eventId: string;
  intent: RsvpIntent;
  updatedAt: string;
};

export type OtpRequest = {
  token: string;
  phone: string;
  code: string;
  inviteCode?: string;
  createdAt: string;
};

export type ModerationReport = {
  id: string;
  reporterId: string;
  targetType: "user" | "event";
  targetId: string;
  reason: string;
  createdAt: string;
};

export type Session = {
  token: string;
  userId: string;
  createdAt: string;
};