import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/home";
import Itinerary from "@/pages/itinerary";
import Cart from "@/pages/cart";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";

import LoadingOverlay from "@/components/loading-overlay";
import FooterNavigation from "@/components/footer-navigation";
import ChatModal from "@/components/chat-modal";
import ViewModeToggle from "@/components/view-mode-toggle";
import { useTripStore } from "@/hooks/use-trip-store";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/itinerary" component={Itinerary} />
      <Route path="/cart" component={Cart} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const viewMode = useTripStore(state => state.viewMode);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="w-full min-h-screen flex justify-center relative z-10">
          {/* Main Container - Responsive based on view mode */}
          <div className={viewMode === 'desktop' 
            ? "w-full max-w-7xl mx-auto min-h-screen flex flex-col relative"
            : "w-full max-w-lg mx-auto min-h-screen flex flex-col relative"
          }>
            {/* Loading Overlay */}
            <LoadingOverlay />
            
            {/* View Mode Toggle - Positioned below header area */}
            <ViewModeToggle />
            
            {/* Main Content */}
            <Router />
            
            {/* Footer Navigation */}
            <FooterNavigation />
            
            {/* Chat Modal */}
            <ChatModal />
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
