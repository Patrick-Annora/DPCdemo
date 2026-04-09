import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import AppShell from "@/components/layout/AppShell";
import Overview from "@/pages/Overview";
import OrderBook from "@/pages/OrderBook";
import RiskAnalysis from "@/pages/RiskAnalysis";
import MaterialsInventory from "@/pages/MaterialsInventory";
import MarketOutlook from "@/pages/MarketOutlook";
import NextSteps from "@/pages/NextSteps";
import Disclaimers from "@/pages/Disclaimers";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
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
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
