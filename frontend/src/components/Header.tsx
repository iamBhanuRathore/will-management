import { useAuth } from "@/contexts/AuthContext";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "./ui/button";
import { ModeToggle } from "./ui/mode-toggle";
import { Link } from "react-router-dom";

const Header = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="p-4 flex justify-between items-center border-b">
      <Link to="/" className="text-2xl font-bold">
        LegacyLock
      </Link>
      <div className="flex items-center gap-4">
        <WalletMultiButton />
        {isAuthenticated && <Button onClick={logout}>Logout</Button>}
        <ModeToggle />
      </div>
    </header>
  );
};

export default Header;
