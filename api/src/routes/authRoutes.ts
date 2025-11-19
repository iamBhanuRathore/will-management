import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { nonceSchema, verifySchema } from "../schema/index";
import crypto from "crypto";
import { verifySolanaSignature } from "../lib/utils";

const authRoutes = new Hono();

// ====================================================================
// 1. Endpoint to get a sign-in nonce
// ====================================================================
authRoutes.get(
  "/nonce/:address",
  zValidator("param", nonceSchema.shape.params),
  async (c) => {
    const { address } = c.req.valid("param");
    const prisma = c.get("prisma");

    try {
      // Find or create the user to ensure a nonce can be stored.
      await prisma.user.upsert({
        where: { address },
        update: {},
        create: { address },
      });

      // Generate a secure, random nonce.
      const nonce = crypto.randomBytes(32).toString("hex");

      // Store the nonce for the user, which invalidates any previous one.
      await prisma.user.update({
        where: { address },
        data: { nonce },
      });

      return c.json({ success: true, data: { nonce } });
    } catch (error) {
      console.error("Error during nonce generation:", error);
      return c.json(
        { success: false, message: "An internal server error occurred." },
        500
      );
    }
  }
);

// ====================================================================
// 2. Endpoint for user login verification
// ====================================================================
authRoutes.post(
  "/verify",
  zValidator("json", verifySchema.shape.body),
  async (c) => {
    const { publicKey, message, signature } = c.req.valid("json");
    const prisma = c.get("prisma");

    // --- Step 1: Call the reusable verification function ---
    const verificationResult = await verifySolanaSignature(
      publicKey,
      signature,
      message,
      prisma
    );

    if (!verificationResult.success) {
      // If verification fails, send the detailed error and status from the function
      return c.json(
        {
          success: false,
          message: verificationResult.message,
        },
        verificationResult.status
      );
    }

    // --- Step 2: If verification is successful, proceed with login logic ---
    try {
      // The nonce has been used, so clear it and generate the session token.
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const sessionTokenExpiry = new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 7
      ); // 7 days

      const updatedUser = await prisma.user.update({
        where: { address: publicKey },
        data: { nonce: null, sessionToken, sessionTokenExpiry },
      });

      return c.json({
        success: true,
        message: "Logged in successfully.",
        data: {
          sessionToken,
          userId: updatedUser.address,
          username: updatedUser.username,
          address: updatedUser.address,
        },
      });
    } catch (error) {
      console.error("Error during session token generation:", error);
      return c.json(
        { success: false, message: "An internal server error occurred." },
        500
      );
    }
  }
);

export default authRoutes;

