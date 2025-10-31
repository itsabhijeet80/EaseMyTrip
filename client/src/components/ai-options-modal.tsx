import { MessageCircle, Mic, X } from "lucide-react";
import { useTripStore } from "@/hooks/use-trip-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AIOptionsModal() {
  const { isAIOptionsOpen, setIsAIOptionsOpen, setIsChatOpen } = useTripStore();

  if (!isAIOptionsOpen) return null;

  const handleChatOption = () => {
    setIsAIOptionsOpen(false);
    setIsChatOpen(true);
  };

  const handleTalkOption = () => {
    setIsAIOptionsOpen(false);
    // TODO: Implement voice chat functionality
    console.log("Voice chat feature coming soon!");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300">
      <div className="bg-card w-[90%] max-w-sm mx-auto rounded-2xl shadow-2xl flex flex-col border border-border overflow-hidden">
        {/* Header */}
        <header className="p-4 border-b border-border flex justify-between items-center bg-primary/5">
          <div>
            <h2 className="text-lg font-bold text-foreground">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">Choose how to interact</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAIOptionsOpen(false)}
            className="text-muted-foreground hover:text-foreground"
            data-testid="close-ai-options-button"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        {/* Options */}
        <div className="p-6 space-y-4">
          {/* Chat Option */}
          <button
            onClick={handleChatOption}
            className={cn(
              "w-full p-6 rounded-xl border-2 border-border bg-card hover:bg-accent transition-all duration-200 flex flex-col items-center space-y-3 group hover:scale-105 hover:shadow-lg"
            )}
            data-testid="ai-chat-option"
          >
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">Chat</h3>
              <p className="text-sm text-muted-foreground">Type your questions and get instant answers</p>
            </div>
          </button>

          {/* Talk Option */}
          <button
            onClick={handleTalkOption}
            className={cn(
              "w-full p-6 rounded-xl border-2 border-border bg-card hover:bg-accent transition-all duration-200 flex flex-col items-center space-y-3 group hover:scale-105 hover:shadow-lg"
            )}
            data-testid="ai-talk-option"
          >
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="h-8 w-8 text-secondary-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">Talk</h3>
              <p className="text-sm text-muted-foreground">Speak naturally with voice interaction</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}









