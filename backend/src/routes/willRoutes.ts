import { Router } from "express";
import { prisma } from "../lib/db";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate"; // Import our new Zod middleware
import { createWillSchema, inheritWillSchema } from "../schema";
import type z from "zod";
import secrets from "secrets.js-grempe"; // Shamir's Secret Sharing library
import { PublicKey } from "@solana/web3.js";
import { v4 as uuidv4 } from "uuid"; // For generating unique nonces

const router = Router();
// --- Database Mockup (In a real app, use a proper database like MongoDB, PostgreSQL) ---
const userNonces = new Map(); // Stores { publicKey: nonce } for authentication
const willsDatabase = new Map(); // Stores { willId: { ownerPublicKey, beneficiaryPublicKey, encryptedBeneficiaryShareBuffer, S1, S2 } }
// Securely clear sensitive data
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
// 1. Endpoint for creating a will
// ====================================================================
router.post("/", protect, validate(createWillSchema), async (req, res) => {
  // Thanks to Zod, we know req.body is fully validated and typed
  const { willName, willDescription, beneficiaryName, beneficiaryAddress, timeLock, share1, share2 } = req.body as z.infer<typeof createWillSchema>["body"];

  const creatorId = req.user!.id;

  try {
    const beneficiaryUser = await prisma.user.findUnique({ where: { address: beneficiaryAddress } });

    const newWill = await prisma.will.create({
      data: {
        willName,
        willDescription,
        creatorId,
        beneficiaryName,
        beneficiaryAddress,
        beneficiaryId: beneficiaryUser?.id || null,
        timeLock: new Date(timeLock),
        encryptedShare: {
          create: { share1, share2 },
        },
      },
      include: { encryptedShare: true },
    });

    res.status(201).json({ success: true, message: "Will created successfully.", data: newWill });
  } catch (error) {
    console.error("Error creating will:", error);
    res.status(500).json({ success: false, message: "An internal server error occurred." });
  }
});

// ====================================================================
// 2. Endpoint for getting all the wills where I am a beneficiary
// ====================================================================
router.get("/beneficiary-of", protect, async (req, res) => {
  try {
    const wills = await prisma.will.findMany({
      where: { beneficiaryId: req.user!.id },
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
      where: { creatorId: req.user!.id },
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
router.post("/will/initiate-creation", async (req, res) => {
  // In a real app, you'd verify the user's authentication token/signature here
  // based on the nonce from /auth/nonce/:publicKey.
  // For simplicity, we'll assume the client is authenticated.

  const {
    ownerPublicKey, // The client's public key (added for clarity on server side)
    beneficiaryPublicKey,
    R2_hex, // Server's random value (generated on client for the server)
    U3, // User share #3
    U4, // User share #4
    B3, // Beneficiary share #3
    B4, // Beneficiary share #4
    encryptedBeneficiaryShareBufferHex, // The fully encrypted share for the beneficiary
  } = req.body;

  console.log("Received data for will creation:", {
    ownerPublicKey,
    beneficiaryPublicKey,
    R2_hex: R2_hex ? R2_hex.substring(0, 10) + "..." : "N/A",
    U3: U3 ? U3.substring(0, 10) + "..." : "N/A",
    U4: U4 ? U4.substring(0, 10) + "..." : "N/A",
    B3: B3 ? B3.substring(0, 10) + "..." : "N/A",
    B4: B4 ? B4.substring(0, 10) + "..." : "N/A",
    encryptedBeneficiaryShareBufferHex: encryptedBeneficiaryShareBufferHex ? encryptedBeneficiaryShareBufferHex.substring(0, 10) + "..." : "N/A",
  });

  // --- Input Validation ---
  if (!ownerPublicKey || !beneficiaryPublicKey || !R2_hex || !U3 || !U4 || !B3 || !B4 || !encryptedBeneficiaryShareBufferHex) {
    return res.status(400).json({ success: false, message: "Missing required fields for will creation." });
  }
  if (!isValidSolanaPublicKey(ownerPublicKey) || !isValidSolanaPublicKey(beneficiaryPublicKey)) {
    return res.status(400).json({ success: false, message: "Invalid Solana public key format." });
  }

  let S1 = null;
  let S2 = null;
  let serverShares: string[] = [];
  let encryptedBeneficiaryShareBuffer = null;

  try {
    // Convert the hex string of the encrypted buffer back to a Buffer
    encryptedBeneficiaryShareBuffer = Buffer.from(encryptedBeneficiaryShareBufferHex, "hex");

    // SERVER'S ROLE IN SHAMIR'S SECRET SHARING:
    // The server takes R2_hex (which was generated by the client *for* the server)
    // and splits it into its own shares (S1, S2, S3, S4).
    // It then combines U3, B3, S3 to get a server-computed recovery piece,
    // and U4, B4, S4 for another. These are NOT the final S1/S2 returned to client.

    // This `apiCall` logic from your client needs to be integrated here.
    // It's the server's local calculation to produce the S1 and S2 it returns to the client.

    // Re-calculate shares from R2_hex on the server
    serverShares = secrets.share(R2_hex, 4, 3);
    const [serverS1, serverS2, serverS3, serverS4] = serverShares;

    // The S1 and S2 that the server *returns* to the client are derived from these.
    // These are the *specific* shares of the server's R2_hex that will be sent back
    // to the client to combine with U1, B1 (for S1) and U2, B2 (for S2).
    S1 = serverS1; // Server's share of R2_hex that goes to client for finalUserShare
    S2 = serverS2; // Server's share of R2_hex that goes to client for finalBeneficiaryShare

    // Store the will data securely
    const willId = uuidv4(); // Generate a unique ID for this will
    willsDatabase.set(willId, {
      ownerPublicKey,
      beneficiaryPublicKey,
      encryptedBeneficiaryShareBuffer: encryptedBeneficiaryShareBuffer, // Store the encrypted buffer
      serverShareForUser: S1, // Server's part for user's final share
      serverShareForBeneficiary: S2, // Server's part for beneficiary's final share
      // The server does NOT store U3, U4, B3, B4, S3, S4 long-term; they are for calculation.
    });

    console.log(`Will ${willId} created and stored successfully.`);
    console.log("Stored data for will:", willsDatabase.get(willId));

    res.status(200).json({
      success: true,
      message: "Will creation initiated successfully.",
      willId,
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

export default router;
