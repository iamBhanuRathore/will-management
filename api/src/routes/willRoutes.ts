import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { protect } from "../middleware/auth";
import { createWillSchema, inheritWillSchema, initiateCreationSchema } from "../schema/index";
// import secrets from "secrets.js-grempe";
import { PublicKey } from "@solana/web3.js";
import crypto from "crypto";
import { Intent, WillStatus } from "@prisma/client";
import { isValidSolanaPublicKey, secureClear, verifySolanaSignature, xorHexStrings } from "../lib/utils";
import { useProgram } from "../lib/program";
import { getSolanaConnection } from "../lib/solana";

const willRoutes = new Hono();

// ====================================================================
// 1. Get all wills where the authenticated user is the beneficiary
// ====================================================================
willRoutes.get("/beneficiary-of", protect, async (c) => {
  const user = c.get("user");
  const prisma = c.get("prisma");

  try {
    const wills = await prisma.will.findMany({
      where: { beneficiaryAddress: user.address },
      select: {
        id: true,
        willName: true,
        willDescription: true,
        timeLock: true,
        status: true,
        creator: { select: { address: true, username: true } },
      },
    });
    return c.json({ success: true, data: wills });
  } catch (error) {
    console.error("Error fetching wills as beneficiary:", error);
    return c.json({ success: false, message: "An internal server error occurred." }, 500);
  }
});

// ====================================================================
// 2. Get all wills created by the authenticated user
// ====================================================================
willRoutes.get("/my-wills", protect, async (c) => {
  const user = c.get("user");
  const prisma = c.get("prisma");

  try {
    const wills = await prisma.will.findMany({
      where: { creatorAddress: user.address },
      select: {
        id: true,
        willName: true,
        willDescription: true,
        timeLock: true,
        beneficiaryAddress: true,
        status: true,
      },
    });
    return c.json({ success: true, data: wills });
  } catch (error) {
    console.error("Error fetching created wills:", error);
    return c.json({ success: false, message: "An internal server error occurred." }, 500);
  }
});

// ====================================================================
// 3. Inherit a will and get the platform's secret shares
// ====================================================================
willRoutes.get("/:willId/inherit", protect, zValidator("param", inheritWillSchema.shape.params), async (c) => {
  const { willId } = c.req.valid("param");
  const user = c.get("user");
  const prisma = c.get("prisma");
  const env = c.get("env");

  try {
    const will = await prisma.will.findUnique({
      where: { id: willId },
      include: { encryptedShare: true },
    });

    if (!will) {
      return c.json({ success: false, message: "Will not found." }, 404);
    }

    if (will.beneficiaryAddress !== user.address) {
      return c.json({ success: false, message: "Forbidden: You are not the beneficiary of this will." }, 403);
    }

    if (new Date() < new Date(will.timeLock)) {
      return c.json({ success: false, message: "The time lock for this will has not yet expired." }, 400);
    }

    // Verify on-chain claim status
    const connection = getSolanaConnection(env.RPC_URL);
    const { program, programId } = useProgram(connection);
    const creatorPubkey = new PublicKey(will.creatorAddress);
    const [willPda] = PublicKey.findProgramAddressSync([creatorPubkey.toBuffer(), Buffer.from(will.willName)], new PublicKey(programId));

    const onchainWill = await (program.account as any).willAccount.fetch(willPda);

    if (onchainWill.status !== 3) {
      // Assuming 3 means 'CLAIMED' on-chain
      return c.json(
        {
          success: false,
          message: "Will must be claimed on-chain before inheriting shares.",
        },
        400
      );
    }

    if (!will.encryptedShare) {
      console.error(`CRITICAL: Encrypted share not found for willId: ${will.id}`);
      return c.json({ success: false, message: "Could not retrieve the encrypted share." }, 500);
    }

    if (will.status === WillStatus.CLAIMED) {
      console.log(`Will ${willId} already claimed by ${user.address}. Re-fetching shares.`);
      return c.json({
        success: true,
        message: "Will already inherited. Returning shares.",
        data: {
          encryptedBeneficiaryShare: will.encryptedShare.encryptedBeneficiaryShare,
          share1: will.encryptedShare.share1,
          share2: will.encryptedShare.share2,
        },
      });
    }

    if (will.status !== WillStatus.ACTIVE) {
      return c.json(
        {
          success: false,
          message: `This will is ${will.status.toLowerCase()} and cannot be claimed.`,
        },
        400
      );
    }

    await prisma.will.update({
      where: { id: willId },
      data: { status: WillStatus.CLAIMED },
    });

    console.log(`Will ${willId} successfully inherited by ${user.address}`);

    return c.json({
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
    return c.json({ success: false, message: "An internal server error occurred." }, 500);
  }
});

// ====================================================================
// 4. Get a nonce for creating a will
// ====================================================================
willRoutes.get("/creation-nonce", protect, async (c) => {
  const user = c.get("user");
  const prisma = c.get("prisma");

  try {
    const nonce = crypto.randomBytes(32).toString("hex");
    const nonceExpiry = new Date(Date.now() + 1000 * 60 * 2); // 2 mins from now

    await prisma.actionNonce.create({
      data: {
        nonce,
        expiresAt: nonceExpiry,
        intent: Intent.CREATE_WILL,
        userId: user.address,
      },
    });

    // Also update the user's primary nonce field for signature verification
    await prisma.user.update({
      where: { address: user.address },
      data: { nonce },
    });

    return c.json({ success: true, data: { nonce } });
  } catch (error) {
    console.error("Error during nonce generation:", error);
    return c.json({ success: false, message: "An internal server error occurred." }, 500);
  }
});

// ====================================================================
// 5. Initiate will creation
// ====================================================================
willRoutes.post("/initiate-creation", protect, zValidator("json", initiateCreationSchema.shape.json), async (c) => {
  const prisma = c.get("prisma");
  const user = c.get("user");
  const body = c.req.valid("json");
  const secretsModule = await import("secrets.js-grempe");
  const secrets = secretsModule.default || secretsModule;
  const { userPublicKey, beneficiaryPublicKey, R2_hex, U3, U4, B3, B4, signedPayload, message, willDescription, willName, timeLock } = body;

  let serverShares: string[] = [];

  try {
    const verification = await verifySolanaSignature(userPublicKey, signedPayload, message, prisma);
    if (!verification.success) {
      return c.json({ success: false, message: verification.message }, verification.status);
    }

    serverShares = secrets.share(R2_hex, 4, 3);
    const [serverS1, serverS2, serverS3, serverS4] = serverShares;

    const server1ShareHex = xorHexStrings(xorHexStrings(U3, B3), serverS3!);
    const server2ShareHex = xorHexStrings(xorHexStrings(U4, B4), serverS4!);

    const will = await prisma.will.create({
      data: {
        timeLock: new Date(timeLock),
        willDescription,
        willName,
        encryptedShare: {
          create: {
            share1: server1ShareHex,
            share2: server2ShareHex,
          },
        },
        creator: { connect: { address: user.address } },
        beneficiary: {
          connectOrCreate: {
            where: { address: beneficiaryPublicKey },
            create: { address: beneficiaryPublicKey },
          },
        },
      },
    });

    console.log(`Will ${will.id} created and stored successfully.`);

    return c.json({
      success: true,
      message: "Will creation initiated successfully.",
      data: {
        willId: will.id,
        S1: serverS1,
        S2: serverS2,
      },
    });
  } catch (error) {
    console.error("Server-side will creation failed:", error);
    return c.json({ success: false, message: "Internal server error during will creation." }, 500);
  } finally {
    secureClear(R2_hex);
    serverShares.forEach(secureClear);
  }
});

// ====================================================================
// 6. Submit final encrypted shares to activate the will
// ====================================================================
willRoutes.post("/submit-creation", protect, async (c) => {
  const prisma = c.get("prisma");
  const user = c.get("user");
  const { encryptedBeneficiaryShare, encryptedUserShare, signedPayload, message, willId } = await c.req.json();

  const dbWill = await prisma.will.findUnique({ where: { id: willId } });

  if (!dbWill) {
    return c.json({ success: false, message: "Will not found." }, 404);
  }

  if (dbWill.creatorAddress !== user.address) {
    return c.json({ success: false, message: "Unauthorized" }, 403);
  }

  const verification = await verifySolanaSignature(user.address, signedPayload, message, prisma);
  if (!verification.success) {
    return c.json({ success: false, message: verification.message }, verification.status);
  }

  const will = await prisma.will.update({
    where: { id: willId },
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

  return c.json({ status: true, data: will });
});

export default willRoutes;
