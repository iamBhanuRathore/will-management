import Dashboard from "@/components/pages/dashboard";
import "./App.css";
import WalletProviderLayout from "@/components/providers/wallet";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "./other.ts";
function App() {
  return (
    <div className="bg-background text-accent-foreground h-full">
      <WalletProviderLayout>
        <WalletMultiButton />
        <Main />
      </WalletProviderLayout>
    </div>
  );
}

export default App;

const Main = () => {
  const { connected } = useWallet();
  return connected ? <Dashboard /> : <div>Hero Page for the non logged in user</div>;
};
