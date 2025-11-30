import { useAuth } from "@/contexts/AuthContext";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "./ui/button";
import { ModeToggle } from "./ui/mode-toggle";
import { Link, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard } from "lucide-react";

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 overflow-hidden rounded-lg">
            <img src="/favicon.ico" alt="LegacyLock Logo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:to-primary transition-all duration-300">LegacyLock</span>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated && location.pathname !== "/dashboard" && (
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 hidden md:flex">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-2">
            <WalletMultiButton className="!bg-primary !h-9 !px-4 !rounded-md !text-sm !font-medium hover:!bg-primary/90 transition-colors" />

            {isAuthenticated && (
              <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive transition-colors" title="Logout">
                <LogOut className="w-5 h-5" />
              </Button>
            )}

            <div className="border-l border-border/50 pl-2 ml-2">
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
