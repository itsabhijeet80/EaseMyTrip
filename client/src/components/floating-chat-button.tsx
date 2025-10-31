import { MessageCircle } from "lucide-react";
import { useTripStore } from "@/hooks/use-trip-store";
import { useLocation } from "wouter";

export default function FloatingChatButton() {
  const [location] = useLocation();
  const { setIsChatOpen, setAIMode, currentTrip } = useTripStore();
  
  // Only show on itinerary and cart pages when we have a trip
  if (location === "/" || !currentTrip) return null;

  return (
    <button
      onClick={() => {
        setAIMode('voice');
        setIsChatOpen(true);
      }}
      className="fixed bottom-20 right-5 bg-primary text-primary-foreground rounded-full p-4 shadow-xl hover:bg-primary/90 focus:outline-none z-30 transition-all duration-200 hover:scale-110 floating-animation"
      data-testid="floating-chat-button"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
}
