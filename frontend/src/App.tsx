import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "@/components/pages/dashboard";
import Login from "@/components/pages/Login";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import "./App.css";
import WalletProviderLayout from "@/components/providers/wallet";
import { ThemeProvider } from "@/components/providers/theme-provider.tsx";
import Header from "./components/Header";
import { WillProvider } from "./contexts/WillContext";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="bg-background text-accent-foreground h-screen flex flex-col">
        <WalletProviderLayout>
          <Router>
            <AuthProvider>
              <WillProvider>
                <Header />
                <main className="flex-grow container mx-auto p-4">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
              </WillProvider>
            </AuthProvider>
          </Router>
        </WalletProviderLayout>
      </div>
    </ThemeProvider>
  );
}

export default App;
