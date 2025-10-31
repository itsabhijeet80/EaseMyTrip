import { useState, useEffect, useRef } from "react";
import { X, Send, CheckCircle, AlertCircle, Undo2, Sparkles } from "lucide-react";
import { useTripStore } from "@/hooks/use-trip-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isAction?: boolean;
  actionStatus?: 'pending' | 'confirmed' | 'rejected';
}

export default function ChatModal() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      text: "Hi! I'm your AI travel assistant. I can help you modify your trip, answer questions, or suggest alternatives. Try saying 'make it cheaper' or 'add a spa day'!",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const { 
    isChatOpen, 
    setIsChatOpen, 
    currentTrip, 
    setCurrentTrip,
    pendingAction, 
    setPendingAction,
    addModificationToHistory,
    undoLastModification,
    modificationHistory
  } = useTripStore();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detect action from message
  const detectActionMutation = useMutation({
    mutationFn: (message: string) => api.detectAction(message, currentTrip?.id),
    onSuccess: (data) => {
      if (data.hasAction && data.needsConfirmation) {
        // Store pending action
        setPendingAction({
          action: data.action,
          params: data.params,
          confirmationMessage: data.confirmationMessage,
          reasoning: data.reasoning
        });
        
        // Add confirmation message to chat
        const confirmMsg: ChatMessage = {
          id: Date.now().toString(),
          text: data.confirmationMessage,
          isUser: false,
          timestamp: new Date(),
          isAction: true,
          actionStatus: 'pending'
        };
        setMessages(prev => [...prev, confirmMsg]);
      } else if (data.hasAction && !data.needsConfirmation) {
        // Execute immediately
        modifyTripMutation.mutate({
          action: data.action,
          params: data.params
        });
      } else {
        // No action, just chat
        chatMutation.mutate(inputValue);
      }
      setIsProcessing(false);
    },
    onError: () => {
      setIsProcessing(false);
      chatMutation.mutate(inputValue);
    }
  });

  // Execute trip modification
  const modifyTripMutation = useMutation({
    mutationFn: ({ action, params }: any) => 
      api.modifyTrip(currentTrip!.id, action, params),
    onSuccess: (data) => {
      // Save previous trip to history
      if (currentTrip) {
        addModificationToHistory({
          timestamp: new Date(),
          action: pendingAction?.action,
          previousTrip: currentTrip,
          newTrip: data.trip
        });
      }
      
      // Update current trip
      setCurrentTrip(data.trip);
      
      // Add success message with changes
      const successMsg: ChatMessage = {
        id: Date.now().toString(),
        text: `✓ Done! ${data.changes.join(', ')}. ${data.suggestion || ''}`,
        isUser: false,
        timestamp: new Date(),
        actionStatus: 'confirmed'
      };
      setMessages(prev => [...prev, successMsg]);
      
      // Clear pending action
      setPendingAction(null);
      
      // Invalidate cart items
      if (currentTrip) {
        queryClient.invalidateQueries({ queryKey: ["/api/trips", currentTrip.id, "cart"] });
      }
    },
    onError: () => {
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        text: "Sorry, I couldn't complete that modification. Please try again.",
        isUser: false,
        timestamp: new Date(),
        actionStatus: 'rejected'
      };
      setMessages(prev => [...prev, errorMsg]);
      setPendingAction(null);
    }
  });

  // Regular chat (no action detected)
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
    if (!message || isProcessing) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    // Detect if message contains an action
    detectActionMutation.mutate(message);
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    
    modifyTripMutation.mutate({
      action: pendingAction.action,
      params: pendingAction.params
    });
  };

  const handleRejectAction = () => {
    setPendingAction(null);
    const rejectMsg: ChatMessage = {
      id: Date.now().toString(),
      text: "No problem! Is there anything else I can help you with?",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, rejectMsg]);
  };

  const handleUndo = () => {
    undoLastModification();
    const undoMsg: ChatMessage = {
      id: Date.now().toString(),
      text: "Undid the last change. Your trip has been restored.",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, undoMsg]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    "Make it cheaper",
    "Add a spa day", 
    "Upgrade hotels",
    "What's included?"
  ];

  if (!isChatOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end backdrop-blur-sm transition-all duration-300 slide-in">
      <div className="bg-card w-full max-w-lg mx-auto rounded-t-2xl shadow-2xl h-[85%] flex flex-col border-t border-border">
        {/* Header */}
        <header className="p-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-md">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Smart Assistant</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Ready to help</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {modificationHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndo}
                className="text-muted-foreground hover:text-foreground"
                title="Undo last change"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              data-testid="close-chat-button"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.isUser ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 transition-all duration-200",
                  message.isUser
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : message.isAction
                    ? "bg-secondary/20 border border-secondary text-foreground rounded-bl-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}
              >
                {message.actionStatus === 'confirmed' && (
                  <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
                )}
                {message.actionStatus === 'rejected' && (
                  <AlertCircle className="w-4 h-4 inline mr-1 text-red-500" />
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {/* Action Confirmation Buttons */}
          {pendingAction && (
            <div className="flex justify-center gap-3 py-2">
              <Button
                onClick={handleConfirmAction}
                disabled={modifyTripMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {modifyTripMutation.isPending ? "Applying..." : "Confirm"}
              </Button>
              <Button
                onClick={handleRejectAction}
                variant="outline"
                size="sm"
                disabled={modifyTripMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          )}
          
          {(isProcessing || chatMutation.isPending) && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3 rounded-bl-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInputValue(action);
                    setTimeout(() => handleSendMessage(), 100);
                  }}
                  className="text-xs h-auto py-1 px-3 rounded-full"
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <footer className="p-4 border-t border-border bg-muted/20">
          <div className="flex items-center space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me to modify your trip..."
              className="flex-1 rounded-full bg-background"
              disabled={isProcessing || modifyTripMutation.isPending}
              data-testid="chat-input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing || modifyTripMutation.isPending}
              className="rounded-full w-10 h-10 p-0"
              data-testid="send-button"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
