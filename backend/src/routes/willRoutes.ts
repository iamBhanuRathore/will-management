import { Router } from "express";
import { prisma } from "../lib/db";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate"; // Import our new Zod middleware
import { createWillSchema, inheritWillSchema, nonceSchema } from "../schema";
import type z from "zod";
import secrets from "secrets.js-grempe"; // Shamir's Secret Sharing library
import { PublicKey } from "@solana/web3.js";
import crypto from "crypto";
import { Intent } from "@prisma/client";
import { verifySolanaSignature } from "../lib/utils";

const router = Router();
const secureClear = (obj: any) => {
  if (typeof obj === "string") {
    return "0".repeat(obj.length);
  }
  if (obj instanceof Uint8Array || obj instanceof Buffer) {
    obj.fill(0);
  }
  return null;
};

// Input Validation: Check if a string is a valid Solana public key
const isValidSolanaPublicKey = (pubkey: string) => {
  try {
    new PublicKey(pubkey);
    return true;
  } catch {
    return false;
  }
};
// ====================================================================
// 2. Endpoint for getting all the wills where I am a beneficiary
// ====================================================================
router.get("/beneficiary-of", protect, async (req, res) => {
  try {
    const wills = await prisma.will.findMany({
      where: { beneficiaryId: req.user!.address },
      select: {
        id: true,
        willName: true,
        willDescription: true,
        timeLock: true,
        isRevoked: true,
        isClaimed: true,
        creator: { select: { address: true, username: true } },
      },
    });
    res.status(200).json({ success: true, data: wills });
  } catch (error) {
    console.error("Error fetching wills as beneficiary:", error);
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
});

// ====================================================================
// 3. Endpoint for getting all the wills I created ("my all wills")
// ====================================================================
router.get("/my-wills", protect, async (req, res) => {
  try {
    const wills = await prisma.will.findMany({
      where: { creatorId: req.user!.address },
      select: {
        id: true,
        willName: true,
        willDescription: true,
        timeLock: true,
        isRevoked: true,
        isClaimed: true,
        beneficiaryAddress: true,
        beneficiaryName: true,
      },
    });
    res.status(200).json({ success: true, data: wills });
  } catch (error) {
    console.error("Error fetching created wills:", error);
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
});

// ====================================================================
// 4. Endpoint to inherit the will and get the platform's secret
// ====================================================================
router.get("/:willId/inherit", protect, validate(inheritWillSchema), async (req, res) => {
  const { willId } = req.params as z.infer<typeof inheritWillSchema>["params"];
  const userAddress = req.user!.address;

  try {
    const will = await prisma.will.findUnique({
      where: { id: willId },
    });

    if (!will) {
      return res.status(404).json({ success: false, message: "Will not found." });
    }
    if (will.beneficiaryAddress !== userAddress) {
      return res.status(403).json({ success: false, message: "Forbidden: You are not the beneficiary of this will." });
    }
    if (will.isRevoked) {
      return res.status(400).json({ success: false, message: "Cannot inherit a will that has been revoked." });
    }
    if (will.isClaimed) {
      return res.status(400).json({ success: false, message: "This will has already been claimed." });
    }
    if (new Date() < new Date(will.timeLock)) {
      return res.status(400).json({ success: false, message: "The time lock for this will has not yet expired." });
    }

    const encryptedShare = await prisma.encryptedShare.findUnique({
      where: { willId: will.id },
    });

    if (!encryptedShare) {
      // This indicates a data integrity issue
      console.error(`CRITICAL: Encrypted share not found for willId: ${will.id}`);
      return res.status(500).json({ success: false, message: "Could not retrieve the encrypted share." });
    }

    // IMPORTANT: In a real system, you would first decrypt the share here using the platform's private key.
    // const decryptedShare = decryptWithPlatformKey(encryptedShare.share);

    res.status(200).json({
      success: true,
      message: "Share retrieved successfully.",
      // For this example, we return the encrypted share. In production, this would be the decrypted share.
      share1: encryptedShare.share1,
      share2: encryptedShare.share2,
    });
  } catch (error) {
    console.error("Error inheriting will:", error);
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
});
router.get("/creation-nonce", protect, async (req, res) => {
  const userAddress = req.user!.address;
  // const verificationResult = await verifySolanaSignature(address, signature, message);

  try {
    const nonce = crypto.randomBytes(32).toString("hex");
    const nonceExpiry = new Date(Date.now() + 1000 * 60 * 2); // 2 mins from now
    await prisma.actionNonce.create({
      data: {
        nonce,
        expiresAt: nonceExpiry,
        intent: Intent.CREATE_WILL,
        userId: userAddress,
      },
    });

    await prisma.user.update({
      where: { address: userAddress },
      data: { nonce },
    });

    res.status(200).json({ success: true, data: { nonce } });
  } catch (error) {
    console.error("Error during nonce generation:", error);
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
});
router.post("/initiate-creation", protect, async (req, res) => {
  const {
    userPublicKey,
    beneficiaryPublicKey,
    R2_hex, // Server's random value (generated on client for the server)
    U3, // User share #3
    U4, // User share #4
    B3, // Beneficiary share #3
    B4, // Beneficiary share #4
    signedPayload,
    message,
    beneficiaryName = "",
    willDescription = "",
    willName = "",
  } = req.body;

  console.log("Received data for will creation:", {
    userPublicKey,
    beneficiaryPublicKey,
    R2_hex: R2_hex ? R2_hex.substring(0, 10) + "..." : "N/A",
    U3: U3 ? U3.substring(0, 10) + "..." : "N/A",
    U4: U4 ? U4.substring(0, 10) + "..." : "N/A",
    B3: B3 ? B3.substring(0, 10) + "..." : "N/A",
    B4: B4 ? B4.substring(0, 10) + "..." : "N/A",
  });

  // --- Input Validation ---
  if (!userPublicKey || !beneficiaryPublicKey || !R2_hex || !U3 || !U4 || !B3 || !B4) {
    return res.status(400).json({ success: false, message: "Missing required fields for will creation." });
  }
  if (!isValidSolanaPublicKey(userPublicKey) || !isValidSolanaPublicKey(beneficiaryPublicKey)) {
    return res.status(400).json({ success: false, message: "Invalid Solana public key format." });
  }

  let S1 = null;
  let S2 = null;
  let serverShares: string[] = [];

  try {
    await verifySolanaSignature(userPublicKey, signedPayload, message);
    serverShares = secrets.share(R2_hex, 4, 3);
    const [serverS1, serverS2, serverS3, serverS4] = serverShares;

    S1 = serverS1; // Server's share of R2_hex that goes to client for finalUserShare
    S2 = serverS2; // Server's share of R2_hex that goes to client for finalBeneficiaryShare

    const tenMinuteFromNow = new Date(); // Need to come from the client
    tenMinuteFromNow.setTime(tenMinuteFromNow.getTime() + 1000 * 60 * 10);
    const will = await prisma.will.create({
      data: {
        beneficiaryAddress: beneficiaryPublicKey,
        beneficiaryName: beneficiaryName, // Can Be anything
        timeLock: tenMinuteFromNow,
        willDescription: willDescription, // Can be anything according to the user
        willName: willName, // Can be anything acc to user
        encryptedShare: {
          create: {
            share1: S1!,
            share2: S2!,
          },
        },
        creator: {
          connect: {
            address: req.user?.address,
          },
        },
      },
    });
    console.log(`Will ${will.id} created and stored successfully.`);

    res.status(200).json({
      success: true,
      message: "Will creation initiated successfully.",
      willId: will.id,
      S1, // These are the calculated server shares (of R2_hex) for the client
      S2, // to combine with their respective user and beneficiary shares.
    });
  } catch (error) {
    console.error("Server-side will creation failed:", error);
    res.status(500).json({ success: false, message: "Internal server error during will creation." });
  } finally {
    // --- SECURITY CLEANUP: Clear sensitive data from server memory ---
    secureClear(R2_hex); // The server should clear R2_hex after processing
    serverShares.forEach(secureClear); // Clear intermediate shares
    // U3, U4, B3, B4 are part of the request body, not directly in server memory.
    // But if copied to local variables, they should be cleared.
  }
});
router.post("/submit-creation", protect, async (req, res) => {
  const { encryptedBeneficiaryShare, encryptedUserShare, signedPayload, message, willId } = req.body;
  await verifySolanaSignature(req.user?.address!, signedPayload, message);
  const will = await prisma.will.update({
    where: {
      id: willId,
    },
    data: {
      encryptedShare: {
        update: {
          data: {
            encryptedUserShare,
            encryptedBeneficiaryShare,
          },
        },
      },
    },
  });
  res.status(200).json({
    status: true,
    data: will,
  });
});
export default router;
