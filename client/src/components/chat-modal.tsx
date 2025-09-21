import { useState } from "react";
import { X, Send, Mic, MessageCircle } from "lucide-react";
import { useTripStore } from "@/hooks/use-trip-store";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatModal() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      text: "Hi! I'm your AI travel assistant. I can help you modify your trip, answer questions, or suggest alternatives. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  
  const { isChatOpen, setIsChatOpen, currentTrip } = useTripStore();

  const chatMutation = useMutation({
    mutationFn: (message: string) => api.chat(message, currentTrip?.id),
    onSuccess: (data) => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    },
  });

  const handleSendMessage = () => {
    const message = inputValue.trim();
    if (!message) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Send to AI
    chatMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const quickActions = [
    "Suggest activities",
    "Change budget", 
    "Find restaurants",
    "Weather info"
  ];

  if (!isChatOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end backdrop-blur-sm transition-all duration-300 slide-in">
      <div className="bg-card w-full max-w-md mx-auto rounded-t-2xl shadow-2xl h-[85%] flex flex-col border-t border-border">
        {/* Header */}
        <header className="p-4 border-b border-border flex justify-between items-center bg-primary/5 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Planner AI</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsChatOpen(false)}
            className="text-muted-foreground hover:text-foreground"
            data-testid="close-chat-button"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        {/* Chat Window */}
        <div className="flex-grow p-4 overflow-y-auto custom-scrollbar flex flex-col space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-bubble p-3 ${
                message.isUser ? "chat-bubble-user" : "chat-bubble-ai"
              }`}
            >
              {!message.isUser && (
                <div className="flex items-start space-x-2">
                  <MessageCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              )}
              {message.isUser && (
                <p className="text-sm">{message.text}</p>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {chatMutation.isPending && (
            <div className="chat-bubble chat-bubble-ai p-3">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-border bg-muted/20">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-muted-foreground hover:text-foreground"
              data-testid="voice-input-button"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your trip..."
              className="flex-grow"
              data-testid="chat-input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || chatMutation.isPending}
              className="bg-primary text-primary-foreground rounded-full p-3 shadow-md hover:bg-primary/90"
              data-testid="send-message-button"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex space-x-2 mt-3 overflow-x-auto custom-scrollbar">
            {quickActions.map((action) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputValue(action);
                  handleSendMessage();
                }}
                className="flex-shrink-0 text-xs"
                data-testid={`quick-action-${action.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {action}
              </Button>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
