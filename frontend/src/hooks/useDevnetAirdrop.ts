import { solanaConnection } from "@/lib/solana";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export const useDevnetAirdrop = () => {
  const connection = solanaConnection();
  const { publicKey } = useWallet();
  const isChecking = useRef(false);

  useEffect(() => {
    const checkAndAirdrop = async () => {
      if (!publicKey || isChecking.current) return;

      try {
        isChecking.current = true;
        const balance = await connection.getBalance(publicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;

        if (solBalance < 1) {
          // Check if we tried recently to avoid spamming the auto-airdrop
          const lastAttempt = sessionStorage.getItem(`airdrop_attempt_${publicKey.toString()}`);

          if (lastAttempt) {
            toast.info("Low Devnet balance detected.", {
              description: "Please visit the faucet if you need more SOL.",
              action: {
                label: "Solana Faucet",
                onClick: () => window.open("https://faucet.solana.com/", "_blank"),
              },
            });
            return;
          }

          toast.info("Low balance detected. Attempting to airdrop 1 SOL...");

          // Mark as attempted immediately
          sessionStorage.setItem(`airdrop_attempt_${publicKey.toString()}`, Date.now().toString());

          try {
            const signature = await connection.requestAirdrop(
              publicKey,
              1 * LAMPORTS_PER_SOL
            );

            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

            await connection.confirmTransaction({
              blockhash,
              lastValidBlockHeight,
              signature
            });

            toast.success("Airdropped 1 SOL to your wallet!");
          } catch (error) {
            console.error("Airdrop failed:", error);
            toast.error("Auto-airdrop failed.", {
              description: "You may be rate limited. Please use the faucet manually.",
              action: {
                label: "Solana Faucet",
                onClick: () => window.open("https://faucet.solana.com/", "_blank"),
              },
            });
          }
        }
      } catch (error) {
        console.error("Error checking balance:", error);
      } finally {
        isChecking.current = false;
      }
    };

    checkAndAirdrop();
  }, [publicKey, connection]);
};
