import { useAuth } from "@/contexts/AuthContext";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "./ui/button";
import { ModeToggle } from "./ui/mode-toggle";
import { Link, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      className="sticky top-0 z-50 w-full border-b border-border/40 glass-effect supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            className="relative w-10 h-10 overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-0.5"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center">
              <img src="/favicon.ico" alt="LegacyLock Logo" className="w-6 h-6 object-cover" />
            </div>
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 bg-clip-text text-transparent group-hover:from-violet-600 group-hover:via-purple-600 group-hover:to-pink-600 transition-all duration-300">
              LegacyLock
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wider">BLOCKCHAIN SECURED</span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated && location.pathname !== "/dashboard" && (
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 hidden md:flex group hover:bg-primary/10 transition-all duration-300">
                <LayoutDashboard className="w-4 h-4 group-hover:text-primary transition-colors" />
                <span className="font-medium">Dashboard</span>
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg blur opacity-0 group-hover:opacity-30 transition duration-300" />
              <WalletMultiButton className="!bg-gradient-to-r !from-violet-600 !to-purple-600 !h-10 !px-5 !rounded-lg !text-sm !font-semibold hover:!from-violet-500 hover:!to-purple-500 !transition-all !duration-300 !shadow-lg hover:!shadow-xl relative" />
            </div>

            {isAuthenticated && (
              <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 group" title="Logout">
                <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </Button>
            )}

            <div className="border-l border-border/50 pl-3 ml-1">
              <ModeToggle />
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
