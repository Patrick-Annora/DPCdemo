import { StrictMode, useState, useEffect, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import { getToken, setToken, clearToken } from "@/lib/auth";
import { LoginPage } from "@/pages/LoginPage";
import AppShell from "@/components/layout/AppShell";
import Overview from "@/pages/Overview";
import OrderBook from "@/pages/OrderBook";
import RiskAnalysis from "@/pages/RiskAnalysis";
import MaterialsInventory from "@/pages/MaterialsInventory";
import MarketOutlook from "@/pages/MarketOutlook";
import NextSteps from "@/pages/NextSteps";
import Disclaimers from "@/pages/Disclaimers";
import SupportPage from "@/pages/Support/SupportPage";

const AuthContext = createContext<{ logout: () => void }>({ logout: () => {} });
export function useAuth() {
  return useContext(AuthContext);
}

function App() {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [checking, setChecking] = useState(!!getToken());

  useEffect(() => {
    const stored = getToken();
    if (!stored) {
      setChecking(false);
      return;
    }
    // Verify the token is still valid
    fetch(`/api/auth/verify?token=${encodeURIComponent(stored)}`, {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.valid) {
          clearToken();
          setTokenState(null);
        }
      })
      .catch(() => {
        // Server unreachable — keep token, let API calls handle 401
      })
      .finally(() => setChecking(false));
  }, []);

  function handleLogin(newToken: string) {
    setToken(newToken);
    setTokenState(newToken);
  }

  function logout() {
    clearToken();
    setTokenState(null);
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AuthContext.Provider value={{ logout }}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Overview />} />
            <Route path="/orders" element={<OrderBook />} />
            <Route path="/risk" element={<RiskAnalysis />} />
            <Route path="/materials" element={<MaterialsInventory />} />
            <Route path="/market" element={<MarketOutlook />} />
            <Route path="/next-steps" element={<NextSteps />} />
            <Route path="/disclaimers" element={<Disclaimers />} />
            <Route path="/support" element={<SupportPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
