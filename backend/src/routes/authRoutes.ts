import { Router } from "express";
import { prisma } from "../lib/db.ts";
import { validate } from "../middleware/validate.ts";
import { nonceSchema, verifySchema } from "../schema/index.ts";
import crypto from "crypto";
// import { verifyMessage } from "ethers";
import nacl from "tweetnacl";
import bs58 from "bs58";
import type z from "zod";
import { verifySolanaSignature } from "../lib/utils.ts";

const router = Router();

// ====================================================================
// 1. Endpoint to get a sign-in nonce
// ====================================================================
router.get("/nonce/:address", validate(nonceSchema), async (req, res) => {
  const { address } = req.params as z.infer<typeof nonceSchema>["params"];

  try {
    // Find or create the user to ensure a nonce can be stored.
    await prisma.user.upsert({
      where: { address },
      update: {},
      create: { address },
    });

    // Generate a secure, random nonce. // TODO: add invalidate time of the nonce as well later
    const nonce = crypto.randomBytes(32).toString("hex");
    const nonceExpiry = new Date(Date.now() + 1000 * 60 * 2); // 2 mins from now

    // Store the nonce for the user, which invalidates any previous one.
    await prisma.user.update({
      where: { address },
      data: { nonce },
    });

    res.status(200).json({ success: true, data: { nonce } });
  } catch (error) {
    console.error("Error during nonce generation:", error);
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
});

// ====================================================================
// 2. Endpoint for user login verification
// ====================================================================
router.post("/verify", validate(verifySchema), async (req, res) => {
  const { publicKey, message, signature } = req.body as z.infer<typeof verifySchema>["body"];

  // --- Step 1: Call the reusable verification function ---
  const verificationResult = await verifySolanaSignature(publicKey, signature, message);

  if (!verificationResult.success) {
    // If verification fails, send the detailed error and status from the function
    return res.status(verificationResult.status).json({
      success: false,
      message: verificationResult.message,
    });
  }

  // --- Step 2: If verification is successful, proceed with login logic ---
  try {
    // The nonce has been used, so clear it and generate the session token.
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

    const updatedUser = await prisma.user.update({
      where: { address: publicKey },
      data: { nonce: null, sessionToken, sessionTokenExpiry },
    });

    res.status(200).json({
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
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
});

export default router;
