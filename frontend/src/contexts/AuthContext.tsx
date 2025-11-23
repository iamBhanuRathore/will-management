import apiClient from "@/lib/api";
import { createEncodedMessage } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react";
import bs58 from "bs58";
import { AUTHENTICATE_MESSAGE } from "@/lib/constant";
import { toast } from "sonner";

interface AuthContextType {
  isAuthenticated: boolean;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { publicKey, signMessage, disconnect } = useWallet();

  const login = useCallback(async () => {
    if (!publicKey || !signMessage) {
      return;
    }

    try {
      const { data } = await apiClient.get(`/api/auth/nonce/${publicKey.toBase58()}`);
      const { nonce } = data.data;

      const { encodedMessage, message } = createEncodedMessage(AUTHENTICATE_MESSAGE, nonce);
      const signature = await signMessage(encodedMessage);

      const loginRes = await apiClient.post("/api/auth/verify", {
        publicKey: publicKey.toBase58(),
        signature: bs58.encode(signature),
        message,
      });

      const { sessionToken } = loginRes.data.data;
      localStorage.setItem("token", sessionToken);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${sessionToken}`;
      setIsAuthenticated(true);
      toast.success("Login successful");
    } catch (error) {
      console.error("Login failed", error);
      toast.error("Login failed. Please try again.");
      logout();
    }
  }, [publicKey, signMessage]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setIsAuthenticated(true);
    } else if (publicKey) {
      login();
    }
    setLoading(false);
  }, [publicKey, login]);

  const logout = () => {
    localStorage.removeItem("token");
    delete apiClient.defaults.headers.common["Authorization"];
    setIsAuthenticated(false);
    disconnect();
    toast.info("Logged out successfully");
  };

  return <AuthContext.Provider value={{ isAuthenticated, logout, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
