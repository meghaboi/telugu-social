import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { LANDING_PAGE_CONTENT, OTP_TTL_MINUTES, RAZORPAY_KEY_ID, STAGE2_PULSE_CARD_LIMIT } from "./constants.js";
import { Stage1Repository } from "./repository.js";
import { EventApplicationDetails, EventCategory, EventPriceFilter, User } from "./types.js";
import {
  addMinutes,
  createIntakeId,
  createNotificationId,
  createOtpToken,
  createSessionToken,
  createUserId,
  formatPriceLabel,
  isAtLeast14,
  normalizeThemePreference,
  nowIso,
  sixDigitOtp,
} from "./utils.js";

type AuthenticatedRequest = Request & { user: User };

const phoneRegex = /^\+?[1-9]\d{7,14}$/;

const requestOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, "Invalid phone format"),
});

const verifyOtpSchema = z.object({
  token: z.string().min(5),
  otp: z.string().length(6),
});

const onboardingSchema = z.object({
  name: z.string().min(2).max(80),
  dob: z.string().date(),
  profilePhoto: z.string().url().or(z.literal("")),
  interests: z.array(z.string().min(2).max(32)).min(3).max(10),
  neighbourhood: z.string().min(2).max(64),
  schoolId: z.string().min(3),
  termsAccepted: z.literal(true),
  termsVersion: z.string().min(4),
  themePreference: z.enum(["system", "light", "dark"]).optional(),
});

const themeSchema = z.object({
  themePreference: z.enum(["system", "light", "dark"]),
});

const eventCategorySchema = z.enum(["music", "sports", "tech", "arts", "volunteering", "community"]);
const eventPriceSchema = z.enum(["any", "free", "paid"]);

const applicationDetailsSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().regex(phoneRegex, "Invalid phone format"),
  answers: z.record(z.string(), z.string().min(1).max(500)).default({}),
});

const paymentConfirmSchema = z.object({
  paymentId: z.string().min(4),
});

const friendRequestSchema = z.object({
  targetUserId: z.string().min(3),
});

const friendRequestResponseSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

const organiserIntakeSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  organisationName: z.string().min(2).max(120),
  message: z.string().min(10).max(2000),
});

function userView(user: User) {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    dob: user.dob,
    profilePhoto: user.profilePhoto,
    interests: user.interests,
    neighbourhood: user.neighbourhood,
    school: user.school,
    termsAcceptance: user.termsAcceptance,
    themePreference: user.themePreference,
    onboardingCompletedAt: user.onboardingCompletedAt,
    createdAt: user.createdAt,
  };
}

function isOnboardingComplete(user: User) {
  return Boolean(
    user.name &&
      user.dob &&
      user.interests.length >= 3 &&
      user.neighbourhood &&
      user.school &&
      user.termsAcceptance,
  );
}

function profileView(viewer: User, target: User, friendshipStatus: "self" | "friend" | "public", mutualFriends: number) {
  const base = {
    id: target.id,
    name: target.name,
    profilePhoto: target.profilePhoto,
    friendshipStatus,
    mutualFriends,
  };

  if (friendshipStatus === "self" || friendshipStatus === "friend") {
    return {
      ...base,
      interests: target.interests,
      neighbourhood: target.neighbourhood,
      school: target.school,
    };
  }

  return {
    ...base,
    interests: [],
    neighbourhood: "",
    school: target.school
      ? {
          id: target.school.id,
          name: target.school.name,
          area: target.school.area,
          city: target.school.city,
        }
      : null,
  };
}

function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

export function createStage1App(repository: Stage1Repository) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const auth = asyncRoute(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({ error: "Missing bearer token" });
    }

    const user = await repository.findUserBySessionToken(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid bearer token" });
    }

    (req as AuthenticatedRequest).user = user;
    next();
  });

  app.get("/health", asyncRoute(async (_, res) => {
    return res.json({ ok: true, service: "telugu-social-api", now: nowIso() });
  }));

  app.get("/terms/current", asyncRoute(async (_, res) => {
    return res.json(await repository.getTermsInfo());
  }));

  app.post("/auth/request-otp", asyncRoute(async (req, res) => {
    const parsed = requestOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const createdAt = nowIso();
    const otpRequest = {
      token: createOtpToken(),
      phone: parsed.data.phone,
      code: sixDigitOtp(),
      createdAt,
      expiresAt: addMinutes(createdAt, OTP_TTL_MINUTES),
    };

    await repository.createOtpRequest(otpRequest);

    return res.json({
      token: otpRequest.token,
      devOtp: otpRequest.code,
      expiresAt: otpRequest.expiresAt,
      message: "OTP generated (dev mode)",
    });
  }));

  app.post("/auth/verify-otp", asyncRoute(async (req, res) => {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const requestRecord = await repository.getOtpRequest(parsed.data.token);
    if (!requestRecord) {
      return res.status(400).json({ error: "OTP request not found" });
    }

    if (new Date(requestRecord.expiresAt).getTime() < Date.now()) {
      await repository.consumeOtpRequest(requestRecord.token);
      return res.status(401).json({ error: "OTP expired" });
    }

    if (requestRecord.code !== parsed.data.otp) {
      return res.status(401).json({ error: "Incorrect OTP" });
    }

    await repository.consumeOtpRequest(requestRecord.token);

    let user = await repository.findUserByPhone(requestRecord.phone);
    if (!user) {
      user = await repository.createUser({
        id: createUserId(),
        phone: requestRecord.phone,
        createdAt: nowIso(),
      });

      await repository.createNotification({
        id: createNotificationId(),
        userId: user.id,
        title: "Complete your onboarding",
        body: "Add your profile details to unlock your account experience.",
        category: "onboarding",
        createdAt: nowIso(),
      });
    }

    const sessionToken = createSessionToken();
    await repository.createSession({
      token: sessionToken,
      userId: user.id,
      createdAt: nowIso(),
    });

    return res.json({
      accessToken: sessionToken,
      user: userView(user),
      onboardingRequired: !isOnboardingComplete(user),
    });
  }));

  app.get("/me", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    return res.json({
      user: userView(user),
      onboardingRequired: !isOnboardingComplete(user),
    });
  }));

  app.put("/me/onboarding", auth, asyncRoute(async (req, res) => {
    const parsed = onboardingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const user = (req as AuthenticatedRequest).user;
    const school = await repository.findSchoolById(parsed.data.schoolId);
    if (!school) {
      return res.status(404).json({ error: "School not found in Hyderabad index" });
    }

    if (!isAtLeast14(parsed.data.dob)) {
      return res.status(400).json({ error: "User must be 14 or older" });
    }

    const termsInfo = await repository.getTermsInfo();
    if (parsed.data.termsVersion !== termsInfo.version) {
      return res.status(409).json({
        error: "Terms version mismatch",
        expectedVersion: termsInfo.version,
      });
    }

    const normalizedInterests = [...new Set(parsed.data.interests.map((interest) => interest.trim().toLowerCase()))];
    if (normalizedInterests.length < 3) {
      return res.status(400).json({ error: "At least 3 unique interests are required" });
    }

    const wasComplete = isOnboardingComplete(user);
    const themePreference = normalizeThemePreference(parsed.data.themePreference);

    const updated = await repository.updateOnboarding(user.id, {
      name: parsed.data.name.trim(),
      dob: parsed.data.dob,
      profilePhoto: parsed.data.profilePhoto,
      interests: normalizedInterests,
      neighbourhood: parsed.data.neighbourhood.trim(),
      schoolId: school.id,
      termsVersion: parsed.data.termsVersion,
      themePreference,
      completedAt: nowIso(),
    });

    if (!wasComplete) {
      await repository.createNotification({
        id: createNotificationId(),
        userId: updated.id,
        title: "Onboarding complete",
        body: "Your profile is set. You can now discover events and communities.",
        category: "onboarding",
        createdAt: nowIso(),
      });
    }

    return res.json({ user: userView(updated), onboardingRequired: !isOnboardingComplete(updated) });
  }));

  app.put("/me/theme", auth, asyncRoute(async (req, res) => {
    const parsed = themeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const user = (req as AuthenticatedRequest).user;
    const themePreference = await repository.updateTheme(user.id, parsed.data.themePreference);

    return res.json({ themePreference });
  }));

  app.get("/schools", auth, asyncRoute(async (req, res) => {
    const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
    const limit = typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : 10;
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 25) : 10;

    const schools = await repository.listSchools(query, safeLimit);
    return res.json({ schools });
  }));

  app.get("/notifications", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const notifications = await repository.listNotifications(user.id);

    return res.json({
      notifications,
      unreadCount: notifications.filter((item) => !item.readAt).length,
    });
  }));

  app.post("/notifications/read-all", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    await repository.markAllNotificationsRead(user.id, nowIso());

    return res.json({ ok: true });
  }));

  app.post("/notifications/:notificationId/read", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const notification = await repository.markNotificationRead(user.id, req.params.notificationId, nowIso());

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.json({ notification });
  }));

  app.get("/pulse", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const upcoming = await repository.listEvents({ limit: STAGE2_PULSE_CARD_LIMIT, price: "any" });
    const friendsGoing = await repository.listFriendsGoing(user.id, 4);
    const friendsByEvent = new Map<string, typeof friendsGoing>();

    for (const signal of friendsGoing) {
      const current = friendsByEvent.get(signal.eventId) ?? [];
      current.push(signal);
      friendsByEvent.set(signal.eventId, current);
    }

    return res.json({
      sections: {
        spotlight: upcoming.slice(0, 3).map((event) => ({
          id: event.id,
          title: event.title,
          category: event.category,
          area: event.area,
          startsAt: event.startsAt,
          priceLabel: formatPriceLabel(event.priceCents, event.currency),
          friendsGoingCount: friendsByEvent.get(event.id)?.length ?? 0,
        })),
        friendsGoing,
        thisWeek: upcoming.slice(0, 6).map((event) => ({
          id: event.id,
          title: event.title,
          category: event.category,
          area: event.area,
          startsAt: event.startsAt,
          priceLabel: formatPriceLabel(event.priceCents, event.currency),
        })),
      },
    });
  }));

  app.get("/events", auth, asyncRoute(async (req, res) => {
    const category = typeof req.query.category === "string" ? eventCategorySchema.safeParse(req.query.category) : null;
    const price = typeof req.query.price === "string" ? eventPriceSchema.safeParse(req.query.price) : null;
    const area = typeof req.query.area === "string" ? req.query.area.trim() : undefined;
    const date = typeof req.query.date === "string" ? req.query.date.trim() : undefined;
    const limit = typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : 12;
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 24) : 12;

    if (category && !category.success) {
      return res.status(400).json({ error: "Invalid category filter" });
    }

    if (price && !price.success) {
      return res.status(400).json({ error: "Invalid price filter" });
    }

    const events = await repository.listEvents({
      category: category?.success ? (category.data as EventCategory) : undefined,
      price: price?.success ? (price.data as EventPriceFilter) : "any",
      area,
      date,
      limit: safeLimit,
    });

    return res.json({
      events: events.map((event) => ({
        ...event,
        priceLabel: formatPriceLabel(event.priceCents, event.currency),
      })),
    });
  }));

  app.get("/events/:eventId", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const event = await repository.findEventById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const organiser = await repository.findOrganiserById(event.organiserId);
    const updates = await repository.listEventUpdates(event.id, 10);
    const friendsAttending = await repository.listFriendsAttendingEvent(event.id, user.id, 6);
    const friendsAttendingCount = await repository.countFriendsAttendingEvent(event.id, user.id);
    const existingApplication = await repository.findLatestEventApplication(user.id, event.id);

    return res.json({
      event: {
        ...event,
        priceLabel: formatPriceLabel(event.priceCents, event.currency),
      },
      organiser,
      updates,
      friendsAttending: friendsAttending.map((friend) => ({
        id: friend.id,
        name: friend.name,
        profilePhoto: friend.profilePhoto,
      })),
      friendsAttendingCount,
      recapPlaceholder: {
        available: false,
        message: "Recap publishing arrives in a later organiser stage.",
      },
      application: existingApplication,
    });
  }));

  app.post("/events/:eventId/applications/start", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const event = await repository.findEventById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const latest = await repository.findLatestEventApplication(user.id, event.id);
    const application = latest && latest.status !== "rejected"
      ? latest
      : await repository.createEventApplication(user.id, event.id, nowIso());

    return res.json({
      step: "review",
      application,
      event: {
        id: event.id,
        title: event.title,
        priceLabel: formatPriceLabel(event.priceCents, event.currency),
      },
    });
  }));

  app.post("/applications/:applicationId/details", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const parsed = applicationDetailsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const application = await repository.updateEventApplicationDetails(
      req.params.applicationId,
      user.id,
      parsed.data as EventApplicationDetails,
      nowIso(),
    );

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    return res.json({ step: "details", application });
  }));

  app.post("/applications/:applicationId/payment-intent", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const application = await repository.findEventApplicationById(req.params.applicationId);
    if (!application || application.userId !== user.id) {
      return res.status(404).json({ error: "Application not found" });
    }

    const event = await repository.findEventById(application.eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const paymentIntent = await repository.createEventPaymentIntent(application.id, user.id, nowIso());
    if (!paymentIntent) {
      return res.status(400).json({ error: "Unable to create payment intent" });
    }

    return res.json({
      step: "payment",
      provider: "razorpay",
      paymentIntent: {
        ...paymentIntent,
        keyId: RAZORPAY_KEY_ID,
      },
      amountLabel: formatPriceLabel(event.priceCents, event.currency),
    });
  }));

  app.post("/applications/:applicationId/confirm-payment", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const parsed = paymentConfirmSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const confirmed = await repository.confirmEventPayment(
      req.params.applicationId,
      user.id,
      parsed.data.paymentId,
      nowIso(),
    );

    if (!confirmed) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (!confirmed.wasAlreadyConfirmed) {
      await repository.createNotification({
        id: createNotificationId(),
        userId: user.id,
        title: "Ticket confirmed",
        body: `Your QR ticket is ready for event entry.`,
        category: "payment",
        createdAt: nowIso(),
      });
    }

    return res.json({
      step: "confirmation",
      application: confirmed.application,
      ticket: confirmed.ticket,
    });
  }));

  app.get("/tickets/:ticketId", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const ticket = await repository.findTicketById(req.params.ticketId, user.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    return res.json({ ticket });
  }));

  app.get("/users/discover", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
    const limit = typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : 10;
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 20) : 10;

    const users = await repository.searchUsers(query, safeLimit, user.id);
    return res.json({ users });
  }));

  app.get("/friends", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const friends = await repository.listFriends(user.id);
    return res.json({
      friends: friends.map((friend) => ({
        id: friend.id,
        name: friend.name,
        profilePhoto: friend.profilePhoto,
        school: friend.school,
      })),
    });
  }));

  app.get("/friends/requests", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const incoming = await repository.listIncomingFriendRequests(user.id);
    const outgoing = await repository.listOutgoingFriendRequests(user.id);
    return res.json({ incoming, outgoing });
  }));

  app.post("/friends/requests", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const parsed = friendRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    if (parsed.data.targetUserId === user.id) {
      return res.status(400).json({ error: "Cannot send a friend request to yourself" });
    }

    const target = await repository.findUserById(parsed.data.targetUserId);
    if (!target) {
      return res.status(404).json({ error: "Target user not found" });
    }

    const existing = await repository.findFriendRequestBetweenUsers(user.id, target.id);
    if (existing && existing.status === "pending") {
      return res.status(409).json({ error: "Friend request already pending" });
    }

    if (await repository.getFriendshipStatus(user.id, target.id) === "friend") {
      return res.status(409).json({ error: "Users are already friends" });
    }

    const requestRecord = await repository.createFriendRequest(user.id, target.id, nowIso());
    await repository.createNotification({
      id: createNotificationId(),
      userId: target.id,
      title: "New friend request",
      body: `${user.name || "Someone"} wants to connect with you.`,
      category: "social",
      createdAt: nowIso(),
    });

    return res.status(201).json({ request: requestRecord });
  }));

  app.post("/friends/requests/:requestId/respond", auth, asyncRoute(async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    const parsed = friendRequestResponseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const requestRecord = await repository.findFriendRequestById(req.params.requestId);
    if (!requestRecord || requestRecord.toUserId !== user.id) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    const updated = await repository.updateFriendRequestStatus(
      requestRecord.id,
      parsed.data.action === "accept" ? "accepted" : "rejected",
      nowIso(),
    );

    if (!updated) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    await repository.createNotification({
      id: createNotificationId(),
      userId: updated.fromUserId,
      title: parsed.data.action === "accept" ? "Friend request accepted" : "Friend request declined",
      body: `${user.name || "A user"} ${parsed.data.action === "accept" ? "accepted" : "declined"} your request.`,
      category: "social",
      createdAt: nowIso(),
    });

    return res.json({ request: updated });
  }));

  app.get("/profiles/:userId", auth, asyncRoute(async (req, res) => {
    const viewer = (req as AuthenticatedRequest).user;
    const target = await repository.findUserById(req.params.userId);
    if (!target) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const friendshipStatus = await repository.getFriendshipStatus(viewer.id, target.id);
    const mutualFriends = await repository.countMutualFriends(viewer.id, target.id);
    return res.json({
      profile: profileView(viewer, target, friendshipStatus, mutualFriends),
    });
  }));

  app.get("/landing/:page", asyncRoute(async (req, res) => {
    const page = LANDING_PAGE_CONTENT[req.params.page];
    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }

    return res.json({ page: req.params.page, ...page });
  }));

  app.post("/landing/organiser-intake", asyncRoute(async (req, res) => {
    const parsed = organiserIntakeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const submission = {
      id: createIntakeId(),
      createdAt: nowIso(),
      ...parsed.data,
    };

    await repository.createOrganiserIntake(submission);
    return res.status(201).json({ ok: true, submissionId: submission.id });
  }));

  app.use((error: unknown, _: Request, res: Response, __: NextFunction) => {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
