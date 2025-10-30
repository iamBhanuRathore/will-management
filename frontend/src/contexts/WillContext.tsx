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

    // ---------- 2. PDA ----------
    const [willPda] = web3.PublicKey.findProgramAddressSync([publicKey.toBuffer(), Buffer.from(willName)], program.programId);
    const accountInfo = await program.provider.connection.getAccountInfo(willPda);
    if (accountInfo) {
      throw new Error(`A will named "${willName}" already exists. Please choose a different name.`);
    }
    // ---------- 3. On-chain tx ----------
    const tx = await program.methods
      .createWill(
        willName,
        willDescription,
        new BN(timeLock.getTime() / 1000), // UNIX seconds
        Buffer.from([]), // placeholders – real encrypted shares go later
        Buffer.from([])
      )
      .accounts({
        will: willPda,
        creator: publicKey,
        beneficiary: new web3.PublicKey(beneficiaryAddress),
        systemProgram: web3.SystemProgram.programId,
      })
      .transaction();

    const txSig = await program.provider.sendAndConfirm?.(tx, [], {
      skipPreflight: false,
      commitment: "confirmed", // You can use 'processed' for a faster but less secure confirmation
    });

    console.log("Transaction confirmed! Signature:", txSig);

    // Check the result on the explorer
    console.log(`https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

    // ---------- 4. Backend initiation ----------
    console.log("Proceeding with backend API calls...");
    // ... rest of your code
    // const { blockhash } = await connection.getLatestBlockhash();
    // tx.recentBlockhash = blockhash;
    // tx.feePayer = publicKey;

    // const signed = await wallet.signTransaction(tx);
    // const rawTx = signed.serialize();

    // const sig = await connection.sendRawTransaction(rawTx, {
    //   skipPreflight: false,
    //   maxRetries: 3,
    // });

    // const txSig = await connection.confirmTransaction(sig, "confirmed");

    console.log("create_will tx:", txSig);

    // ---------- 4. Backend initiation ----------
    const nonceRes = await apiClient.get("/api/will/creation-nonce");
    const { nonce } = nonceRes.data.data;
    const { encodedMessage, message } = createEncodedMessage(AUTHENTICATE_MESSAGE, nonce);
    const signature = await signMessage(encodedMessage);

    const initRes = await apiClient.post("/api/will/initiate-creation", {
      willName,
      willDescription,
      beneficiaryAddress,
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

    // ---------- 6. Submit encrypted shares to backend ----------
    await apiClient.post("/api/will/submit-creation", {
      willId,
      encryptedUserShare: bs58.encode(encryptedUser),
      encryptedBeneficiaryShare: bs58.encode(encryptedBenef),
      signedPayload: bs58.encode(signature),
      message,
    });

    fetchWills();
  };

  // --------------------------------------------------------------
  // 2. INHERIT (off-chain only – decrypt + combine)
  // --------------------------------------------------------------
  const inheritWill = async (willId: string, privateKey: string) => {
    const { data } = await apiClient.get(`/api/will/${willId}/inherit`);
    const { encryptedBeneficiaryShare, share1, share2 } = data.data;

    const decrypted = decryptWithPrivateKey(bs58.decode(encryptedBeneficiaryShare), privateKey);
    const combined = secrets.combine([decrypted, share1, share2]);
    const original = secrets.hex2str(combined);

    return { decryptedShare: decrypted, platformShares: { share1, share2 }, originalSecret: original };
  };

  return <WillContext.Provider value={{ myWills, beneficiaryWills, loading, fetchWills, createWill, inheritWill }}>{children}</WillContext.Provider>;
};

export const useWill = () => {
  const ctx = useContext(WillContext);
  if (!ctx) throw new Error("useWill must be inside WillProvider");
  return ctx;
};
