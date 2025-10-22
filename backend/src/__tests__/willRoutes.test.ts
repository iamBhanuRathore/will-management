import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";
import willRoutes from "../routes/willRoutes";
import { prisma } from "../lib/db";

// Mock the protect middleware
jest.mock("../middleware/auth", () => ({
  protect: (req: Request, res: Response, next: NextFunction) => {
    if (req.headers["x-user-id"]) {
      req.user = { address: `0x${req.headers["x-user-id"]}` };
    }
    next();
  },
}));

const app = express();
app.use(express.json());
app.use("/api/will", willRoutes);

describe("Will Routes", () => {
  // Test for POST /api/will
  describe("POST /api/will", () => {
    it("should create a new will", async () => {
      const newWill = {
        willName: "My Test Will",
        willDescription: "A will for testing purposes.",
        beneficiaryAddress: "0x789",
        timeLock: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        share: "my-secret-share",
      };

      const res = await request(app).post("/api/will").set("x-user-id", "test-user-1").send(newWill);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.willName).toBe(newWill.willName);
    });

    it("should return a 400 error for invalid data", async () => {
      const invalidWill = {
        willName: "", // Invalid
        willDescription: "A will for testing purposes.",
        beneficiaryAddress: "0x789",
        timeLock: new Date().toISOString(),
        share: "my-secret-share",
      };

      const res = await request(app).post("/api/will").set("x-user-id", "test-user-1").send(invalidWill);

      expect(res.status).toBe(400);
    });
  });

  // Test for GET /api/will/beneficiary-of
  describe("GET /api/will/beneficiary-of", () => {
    it("should get wills where the user is a beneficiary", async () => {
      const res = await request(app).get("/api/will/beneficiary-of").set("x-user-id", "test-user-2");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].willName).toBe("Test Will 1");
    });
  });

  // Test for GET /api/will/my-wills
  describe("GET /api/will/my-wills", () => {
    it("should get wills created by the user", async () => {
      const res = await request(app).get("/api/will/my-wills").set("x-user-id", "test-user-1");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].willName).toBe("Test Will 1");
    });
  });

  // Test for GET /api/will/:willId/inherit
  describe("GET /api/will/:willId/inherit", () => {
    it("should inherit a will successfully", async () => {
      const res = await request(app).get("/api/will/test-will-1/inherit").set("x-user-id", "test-user-2");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.share).toBe("test-share");
    });

    it("should return a 404 error for a non-existent will", async () => {
      const res = await request(app).get("/api/will/non-existent-will/inherit").set("x-user-id", "test-user-2");

      expect(res.status).toBe(404);
    });

    it("should return a 403 error for a non-beneficiary", async () => {
      const res = await request(app).get("/api/will/test-will-1/inherit").set("x-user-id", "test-user-1");

      expect(res.status).toBe(403);
    });

    it("should return a 400 error if the will is revoked", async () => {
      await prisma.will.update({ where: { id: "test-will-1" }, data: { status: "ACTIVE" } });
      const res = await request(app).get("/api/will/test-will-1/inherit").set("x-user-id", "test-user-2");
      expect(res.status).toBe(400);
      await prisma.will.update({ where: { id: "test-will-1" }, data: { status: "ACTIVE" } }); // Reset
    });

    it("should return a 400 error if the will is already claimed", async () => {
      await prisma.will.update({ where: { id: "test-will-1" }, data: { status: "ACTIVE" } });
      const res = await request(app).get("/api/will/test-will-1/inherit").set("x-user-id", "test-user-2");
      expect(res.status).toBe(400);
      await prisma.will.update({ where: { id: "test-will-1" }, data: { status: "ACTIVE" } }); // Reset
    });

    it("should return a 400 error if the time lock has not expired", async () => {
      const futureTimeLock = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
      await prisma.will.update({ where: { id: "test-will-1" }, data: { timeLock: futureTimeLock } });
      const res = await request(app).get("/api/will/test-will-1/inherit").set("x-user-id", "test-user-2");
      expect(res.status).toBe(400);
      const pastTimeLock = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
      await prisma.will.update({ where: { id: "test-will-1" }, data: { timeLock: pastTimeLock } }); // Reset
    });
  });
});
