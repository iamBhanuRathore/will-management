import { Connection } from "@solana/web3.js";

export const getSolanaConnection = (rpcUrl: string): Connection => {
  return new Connection(rpcUrl, {
    commitment: "confirmed",
  });
};
