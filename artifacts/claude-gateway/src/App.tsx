import { Switch, Route, Router as WouterRouter } from "wouter";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import { Toaster } from "@/components/ui/toaster";
  import { TooltipProvider } from "@/components/ui/tooltip";
  import NotFound from "@/pages/not-found";
  import Dashboard from "@/pages/dashboard";
  import { useEffect } from "react";

  const queryClient = new QueryClient();

  function DarkModeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => { document.documentElement.classList.add('dark'); }, []);
    return <>{children}</>;
  }

  function Router() {
    return (
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  function App() {
    return (
      <DarkModeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </DarkModeProvider>
    );
  }

  export default App;
  