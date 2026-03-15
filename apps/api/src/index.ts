import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  createInviteCode,
  createOtpToken,
  createSessionToken,
  createUserId,
  events,
  findUserByToken,
  invites,
  moderationReports,
  otpRequests,
  rsvps,
  sessions,
  sixDigitOtp,
  users,
} from "./store.js";
import { Event, RsvpIntent, User } from "./types.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

type AuthenticatedRequest = Request & { user: User };

const requestOtpSchema = z.object({
  phone: z.string().min(8),
  inviteCode: z.string().min(4).optional(),
});

const verifyOtpSchema = z.object({
  token: z.string().min(5),
  otp: z.string().length(6),
  name: z.string().min(2).optional(),
  inviteCode: z.string().optional(),
});

const updateProfileSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
  profilePicture: z.string().url().or(z.literal("")),
  pronouns: z.string().max(32),
  description: z.string().max(280),
});

const createInviteSchema = z.object({
  note: z.string().max(80).optional(),
});

const reportSchema = z.object({
  targetType: z.enum(["user", "event"]),
  targetId: z.string().min(2),
  reason: z.string().min(5).max(500),
});

const rsvpSchema = z.object({
  intent: z.enum(["going", "interested", "not_going"]),
});

function auth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "").trim();

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const user = findUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid bearer token" });
  }

  (req as AuthenticatedRequest).user = user;
  return next();
}

function publicUserView(user: User) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    profilePicture: user.profilePicture,
    pronouns: user.pronouns,
    description: user.description,
    city: user.city,
  };
}

function eventViewForUser(event: Event, user: User) {
  const host = users.find((u) => u.id === event.hostId);
  const allRsvps = rsvps.filter((r) => r.eventId === event.id);
  const friendGoingCount = allRsvps.filter(
    (r) => r.intent === "going" && user.friends.includes(r.userId),
  ).length;

  return {
    ...event,
    host: host ? publicUserView(host) : null,
    friendGoingCount,
    viewerIntent: allRsvps.find((r) => r.userId === user.id)?.intent ?? null,
    rsvpSummary: {
      going: allRsvps.filter((r) => r.intent === "going").length,
      interested: allRsvps.filter((r) => r.intent === "interested").length,
      notGoing: allRsvps.filter((r) => r.intent === "not_going").length,
    },
  };
}

function getInvite(code?: string) {
  if (!code) {
    return null;
  }
  return invites.find((i) => i.code.toUpperCase() === code.toUpperCase()) ?? null;
}

app.get("/health", (_, res) => {
  res.json({ ok: true, service: "telugu-social-api", now: new Date().toISOString() });
});

app.post("/auth/request-otp", (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { phone, inviteCode } = parsed.data;
  const existingUser = users.find((u) => u.phone === phone);

  if (!existingUser) {
    const invite = getInvite(inviteCode);
    if (!invite || invite.usedAt) {
      return res.status(403).json({ error: "Valid unused invite code required for new user" });
    }
  }

  const token = createOtpToken();
  const code = sixDigitOtp();

  otpRequests.push({
    token,
    phone,
    code,
    inviteCode,
    createdAt: new Date().toISOString(),
  });

  return res.json({ token, devOtp: code, message: "OTP generated (dev mode)" });
});

app.post("/auth/verify-otp", (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { token, otp, name, inviteCode } = parsed.data;
  const requestRecord = otpRequests.find((r) => r.token === token);

  if (!requestRecord) {
    return res.status(400).json({ error: "OTP request not found" });
  }
  if (requestRecord.code !== otp) {
    return res.status(401).json({ error: "Incorrect OTP" });
  }

  let user = users.find((u) => u.phone === requestRecord.phone);

  if (!user) {
    const invite = getInvite(inviteCode ?? requestRecord.inviteCode);
    if (!invite || invite.usedAt) {
      return res.status(403).json({ error: "Valid unused invite required for sign-up" });
    }

    user = {
      id: createUserId(),
      phone: requestRecord.phone,
      name: name ?? "New User",
      username: `user_${nanoid(6).toLowerCase()}`,
      profilePicture: "",
      pronouns: "",
      description: "",
      city: "Hyderabad",
      inviteLimit: 5,
      inviteCountUsed: 0,
      friends: [invite.inviterId],
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    invite.usedAt = new Date().toISOString();
    invite.inviteeId = user.id;

    const inviter = users.find((u) => u.id === invite.inviterId);
    if (inviter && !inviter.friends.includes(user.id)) {
      inviter.friends.push(user.id);
    }
  }

  const sessionToken = createSessionToken();
  sessions.push({ token: sessionToken, userId: user.id, createdAt: new Date().toISOString() });

  return res.json({
    accessToken: sessionToken,
    user: publicUserView(user),
    needsProfileCompletion: !user.pronouns || !user.description,
  });
});

app.get("/me", auth, (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  return res.json({
    ...publicUserView(user),
    inviteLimit: user.inviteLimit,
    inviteCountUsed: user.inviteCountUsed,
    invitesRemaining: user.inviteLimit - user.inviteCountUsed,
  });
});

app.put("/me", auth, (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = (req as AuthenticatedRequest).user;
  const { name, username, profilePicture, pronouns, description } = parsed.data;

  const usernameTaken = users.some((u) => u.username === username && u.id !== user.id);
  if (usernameTaken) {
    return res.status(409).json({ error: "Username already in use" });
  }

  user.name = name;
  user.username = username.toLowerCase();
  user.profilePicture = profilePicture;
  user.pronouns = pronouns;
  user.description = description;

  return res.json({ user: publicUserView(user) });
});

app.get("/invites", auth, (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const mine = invites.filter((i) => i.inviterId === user.id);
  return res.json({
    inviteLimit: user.inviteLimit,
    inviteCountUsed: user.inviteCountUsed,
    invitesRemaining: user.inviteLimit - user.inviteCountUsed,
    invites: mine,
  });
});

app.post("/invites", auth, (req, res) => {
  const parsed = createInviteSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = (req as AuthenticatedRequest).user;
  if (user.inviteCountUsed >= user.inviteLimit) {
    return res.status(403).json({ error: "Invite cap reached" });
  }

  const code = createInviteCode();
  invites.push({
    code,
    inviterId: user.id,
    createdAt: new Date().toISOString(),
  });

  user.inviteCountUsed += 1;

  return res.status(201).json({ code, invitesRemaining: user.inviteLimit - user.inviteCountUsed });
});

app.post("/moderation/report", auth, (req, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = (req as AuthenticatedRequest).user;
  moderationReports.push({
    id: `rep_${nanoid(8)}`,
    reporterId: user.id,
    ...parsed.data,
    createdAt: new Date().toISOString(),
  });

  return res.status(201).json({ ok: true });
});

app.get("/feed", auth, (req, res) => {
  const user = (req as AuthenticatedRequest).user;

  const city = typeof req.query.city === "string" ? req.query.city : user.city;
  const query = typeof req.query.query === "string" ? req.query.query.toLowerCase() : "";
  const eventType = typeof req.query.type === "string" ? req.query.type : "";

  const filtered = events
    .filter((event) => event.city.toLowerCase() === city.toLowerCase())
    .filter((event) => (eventType ? event.type === eventType : true))
    .filter((event) => {
      if (!query) {
        return true;
      }
      return (
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      const aFriends = rsvps.filter((r) => r.eventId === a.id && user.friends.includes(r.userId)).length;
      const bFriends = rsvps.filter((r) => r.eventId === b.id && user.friends.includes(r.userId)).length;
      if (aFriends !== bFriends) {
        return bFriends - aFriends;
      }
      return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    })
    .map((event) => eventViewForUser(event, user));

  return res.json({ events: filtered });
});

app.get("/events/search", auth, (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const query = typeof req.query.query === "string" ? req.query.query.toLowerCase() : "";
  const type = typeof req.query.type === "string" ? req.query.type : "";
  const city = typeof req.query.city === "string" ? req.query.city : user.city;

  const matches = events
    .filter((event) => event.city.toLowerCase() === city.toLowerCase())
    .filter((event) => (type ? event.type === type : true))
    .filter((event) => {
      if (!query) {
        return true;
      }
      return [event.title, event.description, event.location, ...event.tags]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .map((event) => eventViewForUser(event, user));

  return res.json({ events: matches });
});

app.get("/events/:eventId", auth, (req, res) => {
  const user = (req as AuthenticatedRequest).user;
  const event = events.find((e) => e.id === req.params.eventId);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  return res.json({ event: eventViewForUser(event, user) });
});

app.post("/events/:eventId/rsvp", auth, (req, res) => {
  const parsed = rsvpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = (req as AuthenticatedRequest).user;
  const event = events.find((e) => e.id === req.params.eventId);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  const existing = rsvps.find((r) => r.eventId === event.id && r.userId === user.id);
  if (existing) {
    existing.intent = parsed.data.intent as RsvpIntent;
    existing.updatedAt = new Date().toISOString();
  } else {
    rsvps.push({
      userId: user.id,
      eventId: event.id,
      intent: parsed.data.intent as RsvpIntent,
      updatedAt: new Date().toISOString(),
    });
  }

  return res.json({ event: eventViewForUser(event, user) });
});

app.listen(port, () => {
  console.log(`telugu-social-api listening on http://localhost:${port}`);
});