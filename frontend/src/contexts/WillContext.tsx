// src/contexts/WillContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import apiClient from "@/lib/api";
import secrets from "secrets.js-grempe";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProgram } from "@/lib/program";
import { generateSecureRandomHex, xorHexStrings, encryptTextMessage, createEncodedMessage, decryptWithPrivateKey } from "@/lib/utils";
import bs58 from "bs58";
import { AUTHENTICATE_MESSAGE } from "@/lib/constant";
import { BN, web3 } from "@coral-xyz/anchor";
import { toast } from "sonner";

interface WillContextType {
  myWills: any[];
  beneficiaryWills: any[];
  loading: boolean;
  fetchWills: () => void;
  createWill: (data: any) => Promise<void>;
  inheritWill: (willId: string, privateKey: string) => Promise<any>;
}

const WillContext = createContext<WillContextType | undefined>(undefined);

export const WillProvider = ({ children }: { children: ReactNode }) => {
  const [myWills, setMyWills] = useState<any[]>([]);
  const [beneficiaryWills, setBeneficiaryWills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { publicKey, signMessage, wallet } = useWallet();
  const { program } = useProgram();

  const fetchWills = useCallback(async () => {
    setLoading(true);
    try {
      const [my, ben] = await Promise.all([apiClient.get("/api/will/my-wills"), apiClient.get("/api/will/beneficiary-of")]);
      setMyWills(my.data.data);
      setBeneficiaryWills(ben.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // --------------------------------------------------------------
  // 1. CREATE WILL (on-chain + off-chain)
  // --------------------------------------------------------------
  const createWill = async ({ willName, willDescription, beneficiaryAddress, timeLock, secret }: any) => {
    if (!publicKey || !signMessage || !program || !wallet) throw new Error("Wallet not ready");

    try {
      // ---------- 1. Secret → shares ----------
      const secretHex = secrets.str2hex(secret);
      const bits = secretHex.length * 4;

      const R1 = generateSecureRandomHex(bits); // beneficiary random
      const R2 = generateSecureRandomHex(bits); // server random
      const P1 = xorHexStrings(xorHexStrings(secretHex, R1), R2); // masked secret

      const userShares = secrets.share(P1, 4, 3); // U1-U4
      const benShares = secrets.share(R1, 4, 3); // B1-B4
      const [U1, U2, U3, U4] = userShares;
      const [B1, B2, B3, B4] = benShares;

      // ---------- 4. Backend initiation ----------
      const nonceRes = await apiClient.get("/api/will/creation-nonce");
      const { nonce } = nonceRes.data.data;
      const { encodedMessage, message } = createEncodedMessage(AUTHENTICATE_MESSAGE, nonce);
      const signature = await signMessage(encodedMessage);

      const initRes = await apiClient.post("/api/will/initiate-creation", {
        willName,
        willDescription,
        beneficiaryPublicKey: beneficiaryAddress,
        timeLock: timeLock.getTime(),
        userPublicKey: publicKey.toBase58(),
        R2_hex: R2,
        U3,
        U4,
        B3,
        B4,
        signedPayload: bs58.encode(signature),
        message,
      });

      const { willId, S1, S2 } = initRes.data.data;

      // ---------- 5. Final encrypted shares ----------
      const finalUserShare = xorHexStrings(xorHexStrings(U1, B1), S1);
      const finalBeneficiaryShare = xorHexStrings(xorHexStrings(U2, B2), S2);

      const encryptedUser = encryptTextMessage(finalUserShare, publicKey.toBase58());
      const encryptedBenef = encryptTextMessage(finalBeneficiaryShare, beneficiaryAddress);

      // ---------- 2. PDA ----------
      const [willPda] = web3.PublicKey.findProgramAddressSync([publicKey.toBuffer(), Buffer.from(willName)], program.programId);
      const accountInfo = await program.provider.connection.getAccountInfo(willPda);
      if (accountInfo) {
        console.log(accountInfo);
        throw new Error(`A will named "${willName}" already exists. Please choose a different name.`);
      }
      // ---------- 3. On-chain tx ----------
      const txSig = await program.methods
        .createWill(
          willName,
          willDescription,
          new BN(timeLock.getTime() / 1000), // UNIX seconds
          Buffer.from(encryptedUser),
          Buffer.from(encryptedBenef)
        )
        .accounts({
          will: willPda,
          creator: publicKey,
          beneficiary: new web3.PublicKey(beneficiaryAddress),
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Transaction confirmed! Signature:", txSig);
      toast.info("Transaction confirmed! Finalizing creation...");

      // Check the result on the explorer
      console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

      // ---------- 4. Backend initiation ----------
      console.log("Proceeding with backend API calls...");

      console.log("create_will tx:", txSig);
      // ---------- 6. Submit encrypted shares to backend ----------
      await apiClient.post("/api/will/submit-creation", {
        willId,
        encryptedUserShare: bs58.encode(encryptedUser),
        encryptedBeneficiaryShare: bs58.encode(encryptedBenef),
        signedPayload: bs58.encode(signature),
        message,
      });

      const txnSig = await program.methods
        .activateWill()
        .accounts({
          will: willPda,
          creator: publicKey,
        })
        .rpc();

      console.log("Transaction confirmed! Signature:", txnSig);

      // Check the result on the explorer
      console.log(`https://explorer.solana.com/tx/${txnSig}?cluster=devnet`);
      fetchWills();
      toast.success("Will created successfully!");
    } catch (error: any) {
      console.error("Error creating will:", error);
      toast.error(error.message || "Failed to create will");
      throw error; // Re-throw to allow component to handle if needed (though we handle UI here)
    }
  };

  // --------------------------------------------------------------
  // 2. INHERIT (off-chain only – decrypt + combine)
  // --------------------------------------------------------------
  const inheritWill = async (willId: string, privateKey: string) => {
    if (!publicKey || !program) throw new Error("Wallet not ready");

    try {
      const willDetails = beneficiaryWills.find((w: any) => w.id === willId);
      if (!willDetails) {
        throw new Error("Will not found in beneficiary list");
      }
      const creatorPubkey = new web3.PublicKey(willDetails.creator.address);
      const [willPda] = web3.PublicKey.findProgramAddressSync([creatorPubkey.toBuffer(), Buffer.from(willDetails.willName)], program.programId);
      const acc = await (program.account as any).willAccount.fetch(willPda);
      console.log(acc);
      let currentStatus = acc.status;
      if (currentStatus !== 1 && currentStatus !== 3) {
        throw new Error(`Will is not in a claimable state. Current status: ${currentStatus}`);
      }
      if (currentStatus === 1) {
        const claimTxSig = await program.methods
          .claimWill()
          .accounts({
            will: willPda,
            beneficiary: publicKey,
          })
          .rpc();

        console.log("Claim transaction confirmed! Signature:", claimTxSig);
        console.log(`https://explorer.solana.com/tx/${claimTxSig}?cluster=devnet`);
        toast.info("Claim transaction confirmed on-chain");
      } else {
        console.log("Will already claimed on-chain.");
      }
      const { data } = await apiClient.get(`/api/will/${willId}/inherit`);
      const { encryptedBeneficiaryShare, share1, share2 } = data.data;

      const decrypted = decryptWithPrivateKey(bs58.decode(encryptedBeneficiaryShare), privateKey);
      const combined = secrets.combine([decrypted, share1, share2]);
      const original = secrets.hex2str(combined);

      toast.success("Will inherited successfully!");
      return { decryptedShare: decrypted, platformShares: { share1, share2 }, originalSecret: original };
    } catch (error: any) {
      console.error("Error inheriting will:", error);
      toast.error(error.message || "Failed to inherit will");
      throw error;
    }
  };

  return <WillContext.Provider value={{ myWills, beneficiaryWills, loading, fetchWills, createWill, inheritWill }}>{children}</WillContext.Provider>;
};

export const useWill = () => {
  const ctx = useContext(WillContext);
  if (!ctx) throw new Error("useWill must be inside WillProvider");
  return ctx;
};
