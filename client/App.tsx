import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";
import Events from "./pages/Events";
import FighterProfile from "./pages/FighterProfile";
import EventPage from "./pages/EventPage";
import CompareFighters from "./pages/CompareFighters";
import Fighters from "./pages/Fighters";
import SignIn from "./pages/SignIn";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/fighters" element={<Fighters />} />
            <Route path="/fighter/:id" element={<FighterProfile />} />
            <Route path="/events" element={<Events />} />
            <Route path="/event/:id" element={<EventPage />} />
            <Route path="/compare" element={<CompareFighters />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/about" element={<PlaceholderPage title="About" description="Learn more about Fight Tracker and our mission to bring you the most comprehensive MMA statistics platform." />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
