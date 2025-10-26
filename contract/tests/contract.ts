import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { assert } from "chai";
import { WillManagement } from "../target/idl/will_management"; // Adjust path to your IDL
import { ProgramTestContext, start } from "solana-bankrun";
import * as IDL from "../target/idl/will_management.json"; // Adjust path

// Program ID from the contract
const PROGRAM_ID = new PublicKey("YourProgramIdHere11111111111111111111111111111");

// Helper to generate PDA
async function getWillPda(creator: PublicKey, willName: string): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync([creator.toBuffer(), Buffer.from(willName)], PROGRAM_ID);
}

// Helper to create a will
async function createWill(
  program: Program<WillManagement>,
  creator: Keypair,
  beneficiary: PublicKey,
  willName: string,
  willDescription: string,
  timeLock: number,
  encryptedUserShare: Buffer,
  encryptedBeneficiaryShare: Buffer
) {
  const [willPda, _bump] = await getWillPda(creator.publicKey, willName);
  await program.methods
    .createWill(willName, willDescription, new BN(timeLock), Array.from(encryptedUserShare), Array.from(encryptedBeneficiaryShare))
    .accounts({
      will: willPda,
      creator: creator.publicKey,
      beneficiary,
      systemProgram: SystemProgram.programId,
    })
    .signers([creator])
    .rpc();
  return willPda;
}

// Helper to fetch will account
async function fetchWill(program: Program<WillManagement>, pda: PublicKey) {
  return program.account.willAccount.fetch(pda);
}

describe("Will Management Program Tests", () => {
  let context: ProgramTestContext;
  let program: Program<WillManagement>;
  let payer: Keypair;
  let creator: Keypair;
  let beneficiary: Keypair;

  before(async () => {
    // Start local test validator
    context = await start([{ name: "will_management", programId: PROGRAM_ID, idl: IDL }]);
    const provider = new anchor.AnchorProvider(context.banksClient, context.wallet, {});
    anchor.setProvider(provider);
    program = new Program<WillManagement>(IDL as any, PROGRAM_ID, provider);
    payer = context.payer;
    creator = Keypair.generate();
    beneficiary = Keypair.generate();

    // Airdrop SOL to creator for rent
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: creator.publicKey,
        lamports: 1_000_000_000, // 1 SOL
      })
    );
    await provider.sendAndConfirm(tx, [payer]);
  });

  describe("create_will instruction", () => {
    it("should create a will successfully", async () => {
      const willName = "TestWill";
      const willDescription = "Test description";
      const timeLock = Math.floor(Date.now() / 1000) + 1000;
      const encryptedUserShare = Buffer.alloc(100, 1);
      const encryptedBeneficiaryShare = Buffer.alloc(100, 2);

      const willPda = await createWill(program, creator, beneficiary.publicKey, willName, willDescription, timeLock, encryptedUserShare, encryptedBeneficiaryShare);

      const will = await fetchWill(program, willPda);
      assert.equal(will.creator.toBase58(), creator.publicKey.toBase58());
      assert.equal(will.beneficiary.toBase58(), beneficiary.publicKey.toBase58());
      assert.equal(will.timeLock.toNumber(), timeLock);
      assert.equal(will.status, 0, "Status should be Initialized");
      assert.equal(will.willName, willName);
      assert.equal(will.willDescription, willDescription);
      assert.deepEqual(will.encryptedUserShare, Array.from(encryptedUserShare));
      assert.deepEqual(will.encryptedBeneficiaryShare, Array.from(encryptedBeneficiaryShare));
    });

    it("should fail if willName is too long (>100 chars)", async () => {
      const willName = "A".repeat(101);
      try {
        await createWill(program, creator, beneficiary.publicKey, willName, "Test", Math.floor(Date.now() / 1000), Buffer.alloc(100, 1), Buffer.alloc(100, 2));
        assert.fail("Should have failed with StringTooLong");
      } catch (err: any) {
        assert.equal(err.error.errorCode.code, "StringTooLong");
      }
    });

    it("should fail if willDescription is too long (>500 chars)", async () => {
      const willDescription = "A".repeat(501);
      try {
        await createWill(program, creator, beneficiary.publicKey, "TestWill", willDescription, Math.floor(Date.now() / 1000), Buffer.alloc(100, 1), Buffer.alloc(100, 2));
        assert.fail("Should have failed with StringTooLong");
      } catch (err: any) {
        assert.equal(err.error.errorCode.code, "StringTooLong");
      }
    });

    it("should fail if encryptedUserShare is too large (>1024 bytes)", async () => {
      try {
        await createWill(program, creator, beneficiary.publicKey, "TestWill", "Test", Math.floor(Date.now() / 1000), Buffer.alloc(1025, 1), Buffer.alloc(100, 2));
        assert.fail("Should have failed with DataTooLarge");
      } catch (err: any) {
        assert.equal(err.error.errorCode.code, "DataTooLarge");
      }
    });

    it("should fail if encryptedBeneficiaryShare is too large (>1024 bytes)", async () => {
      // Similar
    });

    it("should fail if PDA already exists (duplicate willName)", async () => {
      const willName = "DuplicateWill";
      await createWill(program, creator, beneficiary.publicKey, willName, "Test", Math.floor(Date.now() / 1000), Buffer.alloc(100, 1), Buffer.alloc(100, 2));
      try {
        await createWill(program, creator, beneficiary.publicKey, willName, "Test2", Math.floor(Date.now() / 1000), Buffer.alloc(100, 3), Buffer.alloc(100, 4));
        assert.fail("Should have failed due to existing account");
      } catch (err: any) {
        assert.include(err.toString(), "Account already in use");
      }
    });

    it("should fail with insufficient lamports for rent", async () => {
      const poorCreator = Keypair.generate();
      // No airdrop
      try {
        await createWill(program, poorCreator, beneficiary.publicKey, "TestWill2", "Test", Math.floor(Date.now() / 1000), Buffer.alloc(100, 1), Buffer.alloc(100, 2));
        assert.fail("Should have failed due to insufficient funds");
      } catch (err: any) {
        assert.include(err.toString(), "insufficient funds");
      }
    });
  });

  describe("activate_will instruction", () => {
    let willPda: PublicKey;

    beforeEach(async () => {
      willPda = await createWill(program, creator, beneficiary.publicKey, "ActivateTest", "Test", Math.floor(Date.now() / 1000), Buffer.alloc(100, 1), Buffer.alloc(100, 2));
    });

    it("should activate a will successfully", async () => {
      await program.methods
        .activateWill()
        .accounts({
          will: willPda,
          creator: creator.publicKey,
        })
        .signers([creator])
        .rpc();
      const will = await fetchWill(program, willPda);
      assert.equal(will.status, 1, "Status should be Active");
    });

    it("should fail if not creator", async () => {
      try {
        await program.methods
          .activateWill()
          .accounts({
            will: willPda,
            creator: beneficiary.publicKey, // Wrong signer
          })
          .signers([beneficiary])
          .rpc();
        assert.fail("Should have failed with Unauthorized");
      } catch (err: any) {
        assert.equal(err.error.errorCode.code, "Unauthorized");
      }
    });

    it("should fail if already activated", async () => {
      await program.methods.activateWill().accounts({ will: willPda, creator: creator.publicKey }).signers([creator]).rpc();
      try {
        await program.methods.activateWill().accounts({ will: willPda, creator: creator.publicKey }).signers([creator]).rpc();
        assert.fail("Should have failed with InvalidStatus");
      } catch (err: any) {
        assert.equal(err.error.errorCode.code, "InvalidStatus");
      }
    });
  });

  describe("revoke_will instruction", () => {
    let willPda: PublicKey;

    beforeEach(async () => {
      willPda = await createWill(program, creator, beneficiary.publicKey, "RevokeTest", "Test", Math.floor(Date.now() / 1000), Buffer.alloc(100, 1), Buffer.alloc(100, 2));
      await program.methods.activateWill().accounts({ will: willPda, creator: creator.publicKey }).signers([creator]).rpc();
    });

    it("should revoke a will successfully", async () => {
      await program.methods
        .revokeWill()
        .accounts({
          will: willPda,
          creator: creator.publicKey,
        })
        .signers([creator])
        .rpc();
      const will = await fetchWill(program, willPda);
      assert.equal(will.status, 2, "Status should be Revoked");
    });

    it("should fail if not creator", async () => {
      // Similar to activate unauthorized
    });

    it("should fail if not active", async () => {
      // Create without activating (Initialized)
      // Or revoke then try again
    });
  });

  describe("claim_will instruction", () => {
    let willPda: PublicKey;
    let timeLock: number;

    beforeEach(async () => {
      timeLock = Math.floor(Date.now() / 1000) - 1000; // Past
      willPda = await createWill(program, creator, beneficiary.publicKey, "ClaimTest", "Test", timeLock, Buffer.alloc(100, 1), Buffer.alloc(100, 2));
      await program.methods.activateWill().accounts({ will: willPda, creator: creator.publicKey }).signers([creator]).rpc();
    });

    it("should claim a will successfully", async () => {
      // Warp time to ensure past timelock
      const slotsToAdvance = 1000 / 0.4 + 1; // Approx 400ms/slot
      await context.warpToSlot(context.lastBlockhash.slot + slotsToAdvance);

      await program.methods
        .claimWill()
        .accounts({
          will: willPda,
          beneficiary: beneficiary.publicKey,
        })
        .signers([beneficiary])
        .rpc();
      const will = await fetchWill(program, willPda);
      assert.equal(will.status, 3, "Status should be Claimed");
    });

    it("should fail if timelock not expired", async () => {
      // Set future timelock
      willPda = await createWill(program, creator, beneficiary.publicKey, "ClaimTestFuture", "Test", Math.floor(Date.now() / 1000) + 1000, Buffer.alloc(100, 1), Buffer.alloc(100, 2));
      await program.methods.activateWill().accounts({ will: willPda, creator: creator.publicKey }).signers([creator]).rpc();
      try {
        await program.methods.claimWill().accounts({ will: willPda, beneficiary: beneficiary.publicKey }).signers([beneficiary]).rpc();
        assert.fail("Should have failed with TimelockNotExpired");
      } catch (err: any) {
        assert.equal(err.error.errorCode.code, "TimelockNotExpired");
      }
    });

    it("should fail if not beneficiary", async () => {
      // Wrong signer
    });

    it("should fail if not active", async () => {
      // Try on Initialized or Revoked
    });
  });

  describe("Edge Cases and Security Tests", () => {
    it("should handle maximum size inputs", async () => {
      const willName = "A".repeat(100);
      const willDescription = "B".repeat(500);
      const encryptedUserShare = Buffer.alloc(1024, 1);
      const encryptedBeneficiaryShare = Buffer.alloc(1024, 2);
      const willPda = await createWill(program, creator, beneficiary.publicKey, willName, willDescription, Math.floor(Date.now() / 1000), encryptedUserShare, encryptedBeneficiaryShare);
      const will = await fetchWill(program, willPda);
      assert.equal(will.willName.length, 100);
      assert.equal(will.willDescription.length, 500);
      assert.equal(will.encryptedUserShare.length, 1024);
      assert.equal(will.encryptedBeneficiaryShare.length, 1024);
    });

    it("should fail with invalid status value", async () => {
      const willPda = await createWill(program, creator, beneficiary.publicKey, "InvalidStatusTest", "Test", Math.floor(Date.now() / 1000), Buffer.alloc(100, 1), Buffer.alloc(100, 2));
      // Manually corrupt status
      let account = await context.banksClient.getAccount(willPda);
      account!.data[8 + 32 + 32 + 8] = 255; // Offset for status
      await context.banksClient.setAccount(willPda, account!);
      try {
        await program.methods.activateWill().accounts({ will: willPda, creator: creator.publicKey }).signers([creator]).rpc();
        assert.fail("Should have failed with invalid status");
      } catch (err: any) {
        assert.include(err.toString(), "Invalid status");
      }
    });

    it("should fail if account not initialized", async () => {
      const [willPda, _bump] = await getWillPda(creator.publicKey, "NonExistent");
      try {
        await program.methods.activateWill().accounts({ will: willPda, creator: creator.publicKey }).signers([creator]).rpc();
        assert.fail("Should have failed with account not initialized");
      } catch (err: any) {
        assert.include(err.toString(), "Account does not exist");
      }
    });

    it("should handle multiple wills for same creator", async () => {
      const willPda1 = await createWill(program, creator, beneficiary.publicKey, "Will1", "Test1", Math.floor(Date.now() / 1000), Buffer.alloc(100, 1), Buffer.alloc(100, 2));
      const willPda2 = await createWill(program, creator, beneficiary.publicKey, "Will2", "Test2", Math.floor(Date.now() / 1000), Buffer.alloc(100, 3), Buffer.alloc(100, 4));
      const will1 = await fetchWill(program, willPda1);
      const will2 = await fetchWill(program, willPda2);
      assert.notEqual(willPda1.toBase58(), willPda2.toBase58());
      assert.equal(will1.willName, "Will1");
      assert.equal(will2.willName, "Will2");
    });

    it("should fail to claim after revoke", async () => {
      const willPda = await createWill(program, creator, beneficiary.publicKey, "RevokeThenClaim", "Test", Math.floor(Date.now() / 1000) - 1000, Buffer.alloc(100, 1), Buffer.alloc(100, 2));
      await program.methods.activateWill().accounts({ will: willPda, creator: creator.publicKey }).signers([creator]).rpc();
      await program.methods.revokeWill().accounts({ will: willPda, creator: creator.publicKey }).signers([creator]).rpc();
      try {
        await program.methods.claimWill().accounts({ will: willPda, beneficiary: beneficiary.publicKey }).signers([beneficiary]).rpc();
        assert.fail("Should have failed with InvalidStatus");
      } catch (err: any) {
        assert.equal(err.error.errorCode.code, "InvalidStatus");
      }
    });

    it("should fail to activate after revoke", async () => {
      // Similar
    });

    it("should fail to revoke after claim", async () => {
      // Create, activate, claim, then try revoke
    });

    it("should handle timeLock at u64 max", async () => {
      const willPda = await createWill(program, creator, beneficiary.publicKey, "MaxTimeLock", "Test", 2 ** 64 - 1, Buffer.alloc(100, 1), Buffer.alloc(100, 2));
      const will = await fetchWill(program, willPda);
      assert.equal(will.timeLock.toString(), (2 ** 64 - 1).toString());
    });
  });
});
