import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

process.env.DATABASE_PATH = ":memory:";
process.env.JWT_SECRET = "test-secret";

const { app } = await import("./app");

describe("MindCheck API", () => {
  let token = "";

  beforeEach(async () => {
    const response = await request(app).post("/api/auth/signup").send({
      name: "Test User",
      email: `user-${Date.now()}@example.com`,
      password: "password123"
    });
    token = response.body.token;
  });

  it("creates and fetches a check-in", async () => {
    const payload = {
      date: "2026-03-28",
      session: "full",
      sleepHours: 6,
      sleepQuality: 5,
      meals: "mixed",
      activity: "light",
      social: "normal",
      workload: "heavy",
      stressor: "project deadline",
      mood: "uneasy",
      energy: 4,
      meetingCount: "3-5",
      submittedAtLocal: "2026-03-28T22:15:00+05:30"
    };

    const create = await request(app).post("/api/checkins").set("Authorization", `Bearer ${token}`).send(payload);
    expect(create.status).toBe(201);
    expect(create.body.checkIn.stressScore).toBeTypeOf("number");

    const read = await request(app)
      .get("/api/checkins/today")
      .query({ date: "2026-03-28" })
      .set("Authorization", `Bearer ${token}`);

    expect(read.body.checkIns).toHaveLength(1);
    expect(read.body.checkIns[0].date).toBe("2026-03-28");
  });

  it("updates the user profile details", async () => {
    const update = await request(app)
      .patch("/api/auth/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Calm User",
        email: `profile-${Date.now()}@example.com`,
        phoneNumber: "+91 9876543210",
        region: "West Bengal",
        city: "Kolkata"
      });

    expect(update.status).toBe(200);
    expect(update.body.user.name).toBe("Calm User");
    expect(update.body.user.phoneNumber).toBe("+91 9876543210");
    expect(update.body.user.region).toBe("West Bengal");
    expect(update.body.user.city).toBe("Kolkata");
  });
});
