import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl, type Cluster } from "@solana/web3.js";
// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";
import env from "@/utils/env";

// Configuration constants
const NETWORK: Cluster = "devnet";

const WalletProviderLayout = ({ children }: { children: React.ReactNode }) => {
  const endpoint = env.VITE_RPC_URL || clusterApiUrl(NETWORK);

  const validEndpoint = endpoint.startsWith("http") ? endpoint : clusterApiUrl(NETWORK);

  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={validEndpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
export default WalletProviderLayout;
