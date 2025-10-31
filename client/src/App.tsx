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
import FloatingChatButton from "@/components/floating-chat-button";
import ChatModal from "@/components/chat-modal";

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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="max-w-lg mx-auto min-h-screen flex flex-col relative">
          
          {/* Loading Overlay */}
          <LoadingOverlay />
          
          {/* Main Content */}
          <Router />
          
          {/* Floating Chat Button */}
          <FloatingChatButton />
          
          {/* Footer Navigation */}
          <FooterNavigation />
          
          {/* Chat Modal */}
          <ChatModal />
          
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
