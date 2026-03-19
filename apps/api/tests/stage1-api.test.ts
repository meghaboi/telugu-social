import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createStage1App } from "../src/app.js";
import { InMemoryStage1Repository } from "../src/repositories/inMemoryRepository.js";

describe("Stage 1 API", () => {
  let repository: InMemoryStage1Repository;
  let app: ReturnType<typeof createStage1App>;

  beforeEach(async () => {
    repository = new InMemoryStage1Repository();
    await repository.initialize();
    app = createStage1App(repository);
  });

  afterEach(async () => {
    await repository.close();
  });

  async function authenticate(phone = "+919900123456") {
    const otpResponse = await request(app).post("/auth/request-otp").send({ phone });
    expect(otpResponse.status).toBe(200);

    const verifyResponse = await request(app).post("/auth/verify-otp").send({
      token: otpResponse.body.token,
      otp: otpResponse.body.devOtp,
    });

    expect(verifyResponse.status).toBe(200);

    return {
      accessToken: verifyResponse.body.accessToken as string,
      userId: verifyResponse.body.user.id as string,
    };
  }

  it("returns health", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it("allows open-access OTP signup without invites", async () => {
    const { accessToken } = await authenticate("+919911111111");

    const meResponse = await request(app).get("/me").set("Authorization", `Bearer ${accessToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.onboardingRequired).toBe(true);
    expect(meResponse.body.user.phone).toBe("+919911111111");
  });

  it("enforces age 14+ in onboarding", async () => {
    const { accessToken } = await authenticate();

    const terms = await request(app).get("/terms/current");
    const schools = await request(app)
      .get("/schools")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ query: "Madhapur", limit: 1 });

    const response = await request(app)
      .put("/me/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Teen User",
        dob: "2015-01-01",
        profilePhoto: "",
        interests: ["music", "sports", "coding"],
        neighbourhood: "Madhapur",
        schoolId: schools.body.schools[0].id,
        termsAccepted: true,
        termsVersion: terms.body.version,
        themePreference: "system",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("14");
  });

  it("rejects onboarding when terms version is stale", async () => {
    const { accessToken } = await authenticate();

    const schools = await request(app)
      .get("/schools")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ query: "Madhapur", limit: 1 });

    const response = await request(app)
      .put("/me/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Terms User",
        dob: "2004-01-01",
        profilePhoto: "",
        interests: ["music", "sports", "coding"],
        neighbourhood: "Madhapur",
        schoolId: schools.body.schools[0].id,
        termsAccepted: true,
        termsVersion: "2025-01-01",
        themePreference: "system",
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toContain("Terms version mismatch");
  });

  it("completes onboarding and persists profile fields", async () => {
    const { accessToken } = await authenticate();

    const terms = await request(app).get("/terms/current");
    const schools = await request(app)
      .get("/schools")
      .set("Authorization", `Bearer ${accessToken}`)
      .query({ query: "Madhapur", limit: 1 });

    const onboarding = await request(app)
      .put("/me/onboarding")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Test User",
        dob: "2005-06-01",
        profilePhoto: "",
        interests: ["music", "sports", "coding"],
        neighbourhood: "Madhapur",
        schoolId: schools.body.schools[0].id,
        termsAccepted: true,
        termsVersion: terms.body.version,
        themePreference: "dark",
      });

    expect(onboarding.status).toBe(200);
    expect(onboarding.body.onboardingRequired).toBe(false);
    expect(onboarding.body.user.themePreference).toBe("dark");

    const me = await request(app).get("/me").set("Authorization", `Bearer ${accessToken}`);
    expect(me.body.onboardingRequired).toBe(false);
    expect(me.body.user.interests).toEqual(["music", "sports", "coding"]);
    expect(me.body.user.school.name).toBeTruthy();
  });

  it("updates theme preference", async () => {
    const { accessToken } = await authenticate();

    const response = await request(app)
      .put("/me/theme")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ themePreference: "light" });

    expect(response.status).toBe(200);
    expect(response.body.themePreference).toBe("light");
  });

  it("rejects expired OTP", async () => {
    const requestOtp = await request(app).post("/auth/request-otp").send({ phone: "+919922223333" });
    expect(requestOtp.status).toBe(200);

    const record = await repository.getOtpRequest(requestOtp.body.token as string);
    expect(record).toBeTruthy();

    await repository.createOtpRequest({
      ...(record as NonNullable<typeof record>),
      expiresAt: "2000-01-01T00:00:00.000Z",
    });

    const verify = await request(app).post("/auth/verify-otp").send({
      token: requestOtp.body.token,
      otp: requestOtp.body.devOtp,
    });

    expect(verify.status).toBe(401);
    expect(verify.body.error).toContain("expired");
  });

  it("returns notifications and supports read actions", async () => {
    const { accessToken } = await authenticate();

    const notificationsResponse = await request(app)
      .get("/notifications")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(notificationsResponse.status).toBe(200);
    expect(notificationsResponse.body.notifications.length).toBeGreaterThan(0);

    const firstId = notificationsResponse.body.notifications[0].id as string;

    const markOne = await request(app)
      .post(`/notifications/${firstId}/read`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(markOne.status).toBe(200);
    expect(markOne.body.notification.readAt).toBeTruthy();

    const markAll = await request(app)
      .post("/notifications/read-all")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(markAll.status).toBe(200);
    expect(markAll.body.ok).toBe(true);
  });

  it("protects auth-required endpoints", async () => {
    const response = await request(app).get("/schools");
    expect(response.status).toBe(401);
  });
});
