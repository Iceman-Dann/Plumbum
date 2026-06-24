import { Switch, Route, Router as WouterRouter } from "wouter";
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
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import "./styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Nav />
      <main style={{ flex: 1 }}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/result" component={Result} />
          <Route path="/methodology" component={Methodology} />
          <Route path="/research" component={Research} />
          <Route path="/city/:slug" component={City} />
          <Route path="/schools" component={Schools} />
          <Route path="/hotspots" component={Hotspots} />
          <Route path="/data" component={DataPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
