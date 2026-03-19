import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { OTP_TTL_MINUTES } from "./constants.js";
import { Stage1Repository } from "./repository.js";
import { User } from "./types.js";
import {
  addMinutes,
  createNotificationId,
  createOtpToken,
  createSessionToken,
  createUserId,
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

  app.use((error: unknown, _: Request, res: Response, __: NextFunction) => {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
