import { useState } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Result from "@/pages/result";
import Methodology from "@/pages/methodology";
import Research from "@/pages/research";
import City from "@/pages/city";
import Schools from "@/pages/schools";
import Hotspots from "@/pages/hotspots";
import DataPage from "@/pages/data";
import ListingResult from "@/pages/listing-result";
import Accountability from "@/pages/accountability";
import ApiDocs from "@/pages/api-docs";
import ExtensionPage from "@/pages/extension";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/hooks/useTranslation";
import { PregnancyModeProvider } from "@/hooks/usePregnancyMode";
import "./styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  const [location] = useLocation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Nav />
      <main id="main-content" style={{ flex: 1 }} tabIndex={-1}>
        <div key={location} className="page-transition" style={{ height: "100%", width: "100%" }}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/result" component={Result} />
            <Route path="/methodology" component={Methodology} />
            <Route path="/research" component={Research} />
            <Route path="/city/:slug" component={City} />
            <Route path="/schools" component={Schools} />
            <Route path="/hotspots" component={Hotspots} />
            <Route path="/data" component={DataPage} />
            <Route path="/listing-result" component={ListingResult} />
            <Route path="/accountability" component={Accountability} />
            <Route path="/api-docs" component={ApiDocs} />
            <Route path="/extension" component={ExtensionPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <Footer />

      {/* Floating mobile search button */}
      <button
        onClick={() => {
          if (window.location.pathname === "/") {
            const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => searchInput.focus(), 600);
            }
          } else {
            window.location.href = "/";
          }
        }}
        className="mobile-sticky-search-btn"
        aria-label="Search your address for water lead risk"
      >
        🔍 Check my address
      </button>
    </div>
  );
}

function App() {
  useState(() => {
    // Inject Plausible script (cookie-free, GDPR compliant, privacy-first)
    if (typeof window !== "undefined" && !document.getElementById("plausible-analytics-script")) {
      const script = document.createElement("script");
      script.id = "plausible-analytics-script";
      script.defer = true;
      script.dataset.domain = window.location.hostname || "plumbummap.org";
      script.src = "https://plausible.io/js/script.js";
      document.head.appendChild(script);
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <PregnancyModeProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </PregnancyModeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
