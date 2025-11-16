import { Router } from "express";
import { prisma } from "../lib/db.ts";
import { protect } from "../middleware/auth.ts";
import { validate } from "../middleware/validate.ts"; // Import our new Zod middleware
import { createWillSchema, inheritWillSchema, nonceSchema } from "../schema/index.ts";
import type z from "zod";
import secrets from "secrets.js-grempe"; // Shamir's Secret Sharing library
import { PublicKey } from "@solana/web3.js";
import crypto from "crypto";
import { Intent, WillStatus } from "@prisma/client";
import { isValidSolanaPublicKey, secureClear, verifySolanaSignature, xorHexStrings } from "../lib/utils.ts";
import { useProgram } from "../lib/program.ts";

const router = Router();
const { program, programId } = useProgram();
// ====================================================================
// 2. Endpoint for getting all the wills where I am a beneficiary
// ====================================================================
router.get("/beneficiary-of", protect, async (req, res) => {
  try {
    console.log(req.user!.address);
    const wills = await prisma.will.findMany({
      where: { beneficiaryAddress: req.user!.address },
      select: {
        id: true,
        willName: true,
        willDescription: true,
        timeLock: true,
        status: true,
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
      where: { creatorAddress: req.user!.address },
      select: {
        id: true,
        willName: true,
        willDescription: true,
        timeLock: true,
        beneficiaryAddress: true,
        status: true,
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
      include: { encryptedShare: true },
    });

    if (!will) {
      return res.status(404).json({ success: false, message: "Will not found." });
    }

    if (will.beneficiaryAddress !== userAddress) {
      return res.status(403).json({ success: false, message: "Forbidden: You are not the beneficiary of this will." });
    }

    if (new Date() < new Date(will.timeLock)) {
      return res.status(400).json({ success: false, message: "The time lock for this will has not yet expired." });
    }

    // Verify on-chain claim status
    const creatorPubkey = new PublicKey(will.creatorAddress);
    const [willPda] = PublicKey.findProgramAddressSync([creatorPubkey.toBuffer(), Buffer.from(will.willName)], new PublicKey(programId));

    const onchainWill = await (program.account as any).willAccount.fetch(willPda);

    if (onchainWill.status !== 3) {
      return res.status(400).json({
        success: false,
        message: "Will must be claimed on-chain before inheriting shares.",
      });
    }

    if (!will.encryptedShare) {
      console.error(`CRITICAL: Encrypted share not found for willId: ${will.id}`);
      return res.status(500).json({ success: false, message: "Could not retrieve the encrypted share." });
    }

    // === IDEMPOTENT: Allow re-fetch if already claimed by same user ===
    if (will.status === WillStatus.CLAIMED) {
      console.log(`Will ${willId} already claimed by ${userAddress}. Re-fetching shares.`);
      return res.status(200).json({
        success: true,
        message: "Will already inherited. Returning shares.",
        data: {
          encryptedBeneficiaryShare: will.encryptedShare.encryptedBeneficiaryShare,
          share1: will.encryptedShare.share1,
          share2: will.encryptedShare.share2,
        },
      });
    }

    // === First-time claim: Update status  ===
    if (will.status !== WillStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: `This will is ${will.status.toLowerCase()} and cannot be claimed.`,
      });
    }

    await prisma.will.update({
      where: { id: willId },
      data: {
        status: WillStatus.CLAIMED,
      },
    });

    console.log(`Will ${willId} successfully inherited by ${userAddress}`);

    res.status(200).json({
      success: true,
      message: "Will inherited successfully. Share retrieved.",
      data: {
        encryptedBeneficiaryShare: will.encryptedShare.encryptedBeneficiaryShare,
        share1: will.encryptedShare.share1,
        share2: will.encryptedShare.share2,
      },
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
    willDescription = "",
    willName = "",
    timeLock,
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
  if (!userPublicKey || !beneficiaryPublicKey || !R2_hex || !U3 || !U4 || !B3 || !B4 || !timeLock) {
    return res.status(400).json({ success: false, message: "Missing required fields for will creation." });
  }
  if (!isValidSolanaPublicKey(userPublicKey) || !isValidSolanaPublicKey(beneficiaryPublicKey)) {
    return res.status(400).json({ success: false, message: "Invalid Solana public key format." });
  }

  let serverShares: string[] = [];

  try {
    const verification = await verifySolanaSignature(userPublicKey, signedPayload, message);

    if (!verification.success) {
      return res.status(verification.status).json({ success: verification.status, message: verification.message });
    }

    serverShares = secrets.share(R2_hex, 4, 3);
    const [serverS1, serverS2, serverS3, serverS4] = serverShares;

    // TODO: Need to encrypt Them as well, So if the DB got hacked we dont get f*cked.
    const server1ShareHex = xorHexStrings(xorHexStrings(U3, B3), serverS3!);
    const server2ShareHex = xorHexStrings(xorHexStrings(U4, B4), serverS4!);

    const will = await prisma.will.create({
      data: {
        timeLock: new Date(timeLock),
        willDescription: willDescription,
        willName: willName,
        encryptedShare: {
          create: {
            share1: server1ShareHex!,
            share2: server2ShareHex!,
          },
        },
        creator: {
          connect: {
            address: req.user?.address,
          },
        },
        beneficiary: {
          connectOrCreate: {
            where: {
              address: beneficiaryPublicKey,
            },
            create: {
              address: beneficiaryPublicKey,
            },
          },
        },
      },
    });
    console.log(`Will ${will.id} created and stored successfully.`);

    res.status(200).json({
      success: true,
      message: "Will creation initiated successfully.",
      data: {
        willId: will.id,
        S1: serverS1, // These are the calculated server shares (of R2_hex) for the client
        S2: serverS2, // to combine with their respective user and beneficiary shares.
      },
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
  const dbWill = await prisma.will.findUnique({
    where: { id: willId },
  });

  if (!dbWill) {
    return res.status(404).json({ success: false, message: "Will not found." });
  }

  if (dbWill.creatorAddress !== req.user?.address) {
    throw new Error("Unauthorized");
  }
  const verification = await verifySolanaSignature(req.user?.address!, signedPayload, message);

  if (!verification.success) {
    return res.status(verification.status).json({ success: verification.status, message: verification.message });
  }

  const will = await prisma.will.update({
    where: {
      id: willId,
    },
    data: {
      encryptedShare: {
        update: {
          encryptedBeneficiaryShare,
          encryptedUserShare,
        },
      },
      status: WillStatus.ACTIVE,
    },
  });
  res.status(200).json({
    status: true,
    data: will,
  });
});
export default router;
