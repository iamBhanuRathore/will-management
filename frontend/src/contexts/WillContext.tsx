import { createContext, useContext, useState, type ReactNode, useCallback } from "react";
import apiClient from "@/lib/api";
import secrets from "secrets.js-grempe";
import { useWallet } from "@solana/wallet-adapter-react";
import { createEncodedMessage, decryptWithPrivateKey, encryptTextMessage, generateSecureRandomHex, xorHexStrings } from "@/lib/utils";
import { AUTHENTICATE_MESSAGE } from "@/lib/constant";
import bs58 from "bs58";

interface WillContextType {
  myWills: any[];
  beneficiaryWills: any[];
  loading: boolean;
  fetchWills: () => void;
  inheritWill: (willId: string, privateKey: string) => Promise<{ decryptedShare: string; platformShares: { share1: string; share2: string }; originalSecret: string }>;
  createWill: (willData: any) => Promise<void>;
}

const WillContext = createContext<WillContextType | undefined>(undefined);

export const WillProvider = ({ children }: { children: ReactNode }) => {
  const [myWills, setMyWills] = useState([]);
  const [beneficiaryWills, setBeneficiaryWills] = useState([]);
  const [loading, setLoading] = useState(true);
  const { publicKey, signMessage } = useWallet();

  const fetchWills = useCallback(async () => {
    setLoading(true);
    try {
      const [myWillsRes, beneficiaryWillsRes] = await Promise.all([apiClient.get("/api/will/my-wills"), apiClient.get("/api/will/beneficiary-of")]);
      setMyWills(myWillsRes.data.data);
      setBeneficiaryWills(beneficiaryWillsRes.data.data);
    } catch (error) {
      console.error("Failed to fetch wills", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const inheritWill = async (willId: string, privateKey: string) => {
    try {
      if (!publicKey || !signMessage) {
        throw new Error("Wallet not connected or does not support signing.");
      }

      const response = await apiClient.get(`/api/will/${willId}/inherit`);
      const { data: encryptedData } = response.data;

      const encryptedPayload = bs58.decode(encryptedData.encryptedBeneficiaryShare);
      const decryptedShare = decryptWithPrivateKey(encryptedPayload, privateKey);

      const sharesToCombine = [decryptedShare, encryptedData.share1, encryptedData.share2];

      const reconstructedSecretHex = secrets.combine(sharesToCombine);

      const originalSecret = secrets.hex2str(reconstructedSecretHex);

      return {
        decryptedShare,
        encryptedBeneficiaryShare: encryptedData.encryptedBeneficiaryShare,
        platformShares: {
          share1: encryptedData.share1,
          share2: encryptedData.share2,
        },
        originalSecret,
      };
    } catch (error) {
      console.error("Failed to inherit will", error);
      throw error;
    }
  };
  const createWill = async (willData: any) => {
    if (!publicKey || !signMessage) throw new Error("Wallet not connected");

    // 1. Generate the main secret and split it into shares
    const secretHex = secrets.str2hex(willData.secret);
    const bits = secretHex.length * 4;

    // CRYPTOGRAPHIC MASKING: Create masked secret using XOR
    // Formula: MaskedSecret = Secret ⊕ BeneficiaryRandom ⊕ ServerRandom

    const R1_hex = generateSecureRandomHex(bits); // Beneficiary's random value
    const R2_hex = generateSecureRandomHex(bits); // Server's random value
    const P1_hex = xorHexStrings(xorHexStrings(secretHex, R1_hex), R2_hex);

    let userShares = secrets.share(P1_hex, 4, 3); // Split user's masked secret
    let beneficiaryShares = secrets.share(R1_hex, 4, 3); // Split beneficiary's random value

    const [U1, U2, U3, U4] = userShares; // User shares: U1, U2, U3, U4
    const [B1, B2, B3, B4] = beneficiaryShares; // Beneficiary shares: B1, B2, B3, B4

    // 4. Get a creation nonce
    const nonceRes = await apiClient.get("/api/will/creation-nonce");
    const { nonce } = nonceRes.data.data;

    // 5. Sign the payload
    const { encodedMessage, message } = createEncodedMessage(AUTHENTICATE_MESSAGE, nonce);
    const signature = await signMessage(encodedMessage);

    // 6. Initiate will creation
    const initiateRes = await apiClient.post("/api/will/initiate-creation", {
      ...willData,
      userPublicKey: publicKey.toBase58(),
      beneficiaryPublicKey: willData.beneficiaryAddress,
      R2_hex,
      U3,
      U4,
      B3,
      B4,
      signedPayload: bs58.encode(signature),
      message,
      willDescription: willData.willDescription,
      willName: willData.willName,
      timeLock: willData.timeLock,
    });

    const { willId, S1, S2 } = initiateRes.data.data;

    // Beneficiary's Final Share = U2 ⊕ B2 ⊕ S2
    // This combines: UserShare + BeneficiaryShare + ServerShare

    const finalUserShareHex = xorHexStrings(xorHexStrings(U1, B1), S1);
    const finalBeneficiaryShareHex = xorHexStrings(xorHexStrings(U2, B2), S2);
    const encryptedUserShare = encryptTextMessage(finalUserShareHex, publicKey.toBase58());
    const encryptedBeneficiaryShare = encryptTextMessage(finalBeneficiaryShareHex, willData.beneficiaryAddress);
    console.log(finalBeneficiaryShareHex, bs58.encode(encryptedBeneficiaryShare));
    // 8. Submit the final shares
    await apiClient.post("/api/will/submit-creation", {
      willId,
      // encryptedUserShare: finalUserShareHex,
      // encryptedBeneficiaryShare: finalBeneficiaryShareHex,
      encryptedUserShare: bs58.encode(encryptedUserShare),
      encryptedBeneficiaryShare: bs58.encode(encryptedBeneficiaryShare),
      signedPayload: bs58.encode(signature),
      message,
    });

    fetchWills();
  };

  return <WillContext.Provider value={{ myWills, beneficiaryWills, loading, fetchWills, inheritWill, createWill }}>{children}</WillContext.Provider>;
};

export const useWill = () => {
  const context = useContext(WillContext);
  if (context === undefined) {
    throw new Error("useWill must be used within a WillProvider");
  }
  return context;
};
