import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "@/components/pages/dashboard";
import Login from "@/components/pages/Login";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import "./App.css";
import WalletProviderLayout from "@/components/providers/wallet";
import { ThemeProvider } from "@/components/providers/theme-provider.tsx";
import Header from "./components/Header";
import { WillProvider } from "./contexts/WillContext";
import Landing from "./components/pages/Landing";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="bg-accent text-accent-foreground min-h-screen flex flex-col">
        <WalletProviderLayout>
          <Router>
            <AuthProvider>
              <WillProvider>
                <Toaster />
                <AppContent />
              </WillProvider>
            </AuthProvider>
          </Router>
        </WalletProviderLayout>
      </div>
    </ThemeProvider>
  );
}

const AppContent = () => {
  const location = useLocation();
  const showHeader = location.pathname !== "/";

  return (
    <>
      {showHeader && <Header />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
};

export default App;
