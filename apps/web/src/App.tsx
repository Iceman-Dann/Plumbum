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
      <Nav />
      <main style={{ flex: 1 }}>
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
    </div>
  );
}

function App() {
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
