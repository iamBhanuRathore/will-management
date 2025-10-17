import { createContext, useContext, useState, type ReactNode, useCallback } from "react";
import apiClient from "@/lib/api";
import secrets from "secrets.js-grempe";
import { useWallet } from "@solana/wallet-adapter-react";
import { createEncodedMessage } from "@/lib/utils";

interface WillContextType {
  myWills: any[];
  beneficiaryWills: any[];
  loading: boolean;
  fetchWills: () => void;
  inheritWill: (willId: string) => Promise<any>;
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
      const [myWillsRes, beneficiaryWillsRes] = await Promise.all([
        apiClient.get("/api/will/my-wills"),
        apiClient.get("/api/will/beneficiary-of"),
      ]);
      setMyWills(myWillsRes.data.data);
      setBeneficiaryWills(beneficiaryWillsRes.data.data);
    } catch (error) {
      console.error("Failed to fetch wills", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const inheritWill = async (willId: string) => {
    try {
      const response = await apiClient.get(`/api/will/${willId}/inherit`);
      return response.data;
    } catch (error) {
      console.error("Failed to inherit will", error);
      throw error;
    }
  };

  const createWill = async (willData: any) => {
    if (!publicKey || !signMessage) throw new Error("Wallet not connected");

    // 1. Generate the main secret and split it into shares
    const secret = secrets.random(512); // 512-bit secret
    const shares = secrets.share(secret, 4, 3); // 4 shares, 3 required
    const [U1, U2, U3, U4] = shares; // User's shares

    // 2. Generate another set of shares for the beneficiary
    const beneficiarySecret = secrets.random(512);
    const beneficiaryShares = secrets.share(beneficiarySecret, 4, 3);
    const [B1, B2, B3, B4] = beneficiaryShares;

    // 3. Generate a random value for the server
    const R2_hex = secrets.random(512);

    // 4. Get a creation nonce
    const nonceRes = await apiClient.get("/api/will/creation-nonce");
    const { nonce } = nonceRes.data.data;

    // 5. Sign the payload
    const { encodedMessage, message } = createEncodedMessage("Create Will", nonce);
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
      signedPayload: Buffer.from(signature).toString("base64"),
      message,
    });

    const { willId, S1, S2 } = initiateRes.data;

    // 7. Combine shares to create final encrypted shares
    const finalUserShare = secrets.combine([U1, B1, S1]);
    const finalBeneficiaryShare = secrets.combine([U2, B2, S2]);

    // 8. Submit the final shares
    await apiClient.post("/api/will/submit-creation", {
      willId,
      encryptedUserShare: finalUserShare,
      encryptedBeneficiaryShare: finalBeneficiaryShare,
      signedPayload: Buffer.from(signature).toString("base64"),
      message,
    });

    // 9. Refresh wills
    fetchWills();
  };

  return (
    <WillContext.Provider value={{ myWills, beneficiaryWills, loading, fetchWills, inheritWill, createWill }}>
      {children}
    </WillContext.Provider>
  );
};

export const useWill = () => {
  const context = useContext(WillContext);
  if (context === undefined) {
    throw new Error("useWill must be used within a WillProvider");
  }
  return context;
};
