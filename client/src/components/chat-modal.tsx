import { useState, useEffect, useRef } from "react";
import { X, Send, Mic, Keyboard, CheckCircle, AlertCircle, Undo2 } from "lucide-react";
import { useTripStore } from "@/hooks/use-trip-store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

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
      text: "Hi! I'm your AI travel assistant. I can help you modify your trip or answer questions. Try saying 'make it cheaper' or 'add a spa day'.",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState("");
  const [showVoiceResponse, setShowVoiceResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const {
    isChatOpen,
    setIsChatOpen,
    aiMode,
    setAIMode,
    currentTrip,
    setCurrentTrip,
    pendingAction,
    setPendingAction,
    addModificationToHistory,
    undoLastModification,
    modificationHistory
  } = useTripStore();

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error: speechError
  } = useSpeechRecognition();

  useEffect(() => {
    if (aiMode === 'text') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, aiMode]);

  useEffect(() => {
    if (!isChatOpen) {
      stopListening();
      return;
    }

    if (aiMode === 'voice') {
      setVoiceResponse("");
      setShowVoiceResponse(false);
      if (isSupported && !isListening) {
        startListening();
      }
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isChatOpen, aiMode]);

  useEffect(() => {
    if (!isChatOpen || aiMode !== 'voice') return;

    if (!isListening && transcript.trim().length > 3) {
      detectActionMutation.mutate(transcript.trim());
      resetTranscript();
    }
  }, [isListening, transcript, aiMode, isChatOpen]);

  useEffect(() => {
    if (aiMode === 'text') {
      setShowVoiceResponse(false);
      stopListening();
    }
  }, [aiMode]);

  const handleClose = () => {
    stopListening();
    setIsChatOpen(false);
    setAIMode('voice');
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const provideVoiceFeedback = (text: string) => {
    if (aiMode !== 'voice' || !text) return;
    setVoiceResponse(text);
    setShowVoiceResponse(true);
    speakResponse(text);
  };

  const detectActionMutation = useMutation({
    mutationFn: (message: string) => api.detectAction(message, currentTrip?.id),
    onSuccess: (data, originalMessage) => {
      if (data.hasAction && data.needsConfirmation) {
        setPendingAction({
          action: data.action,
          params: data.params,
          confirmationMessage: data.confirmationMessage,
          reasoning: data.reasoning
        });

        const confirmMsg: ChatMessage = {
          id: Date.now().toString(),
          text: data.confirmationMessage,
          isUser: false,
          timestamp: new Date(),
          isAction: true,
          actionStatus: 'pending'
        };
        setMessages(prev => [...prev, confirmMsg]);

        provideVoiceFeedback(data.confirmationMessage);
      } else if (data.hasAction && !data.needsConfirmation) {
        modifyTripMutation.mutate({
          action: data.action,
          params: data.params
        });
      } else {
        chatMutation.mutate(originalMessage);
      }
      setIsProcessing(false);
    },
    onError: (_, originalMessage) => {
      setIsProcessing(false);
      chatMutation.mutate(originalMessage);
    }
  });

  const modifyTripMutation = useMutation({
    mutationFn: ({ action, params }: any) => 
      api.modifyTrip(currentTrip!.id, action, params),
    onSuccess: (data) => {
      if (currentTrip) {
        addModificationToHistory({
          timestamp: new Date(),
          action: pendingAction?.action,
          previousTrip: currentTrip,
          newTrip: data.trip
        });
      }

      setCurrentTrip(data.trip);

      const successMsg: ChatMessage = {
        id: Date.now().toString(),
        text: `✓ Done! ${data.changes.join(', ')}${data.suggestion ? `. ${data.suggestion}` : ''}`,
        isUser: false,
        timestamp: new Date(),
        actionStatus: 'confirmed'
      };
      setMessages(prev => [...prev, successMsg]);

      provideVoiceFeedback(successMsg.text);

      setPendingAction(null);

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
      provideVoiceFeedback(errorMsg.text);
      setPendingAction(null);
    }
  });

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

      provideVoiceFeedback(data.response);
    },
  });

  const handleSendMessage = () => {
    const message = inputValue.trim();
    if (!message || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);

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
    provideVoiceFeedback(rejectMsg.text);
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
    provideVoiceFeedback(undoMsg.text);
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
      <div className="relative px-4 pb-6 pointer-events-none flex justify-center">
        <div className="pointer-events-auto w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-200">
          <header className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-background/80 backdrop-blur">
            <div>
              <p className="text-sm font-semibold text-foreground">AI Assistant</p>
              <p className="text-xs text-muted-foreground">
                {aiMode === 'voice' ? (isListening ? 'Listening…' : isSupported ? 'Tap mic to speak' : 'Voice not supported') : 'Type your request'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center bg-muted rounded-full p-1 text-xs">
                <button
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3 py-1 transition-all",
                    aiMode === 'voice' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  )}
                  onClick={() => setAIMode('voice')}
                >
                  <Mic className="h-3.5 w-3.5" />
                  Voice
                </button>
                <button
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3 py-1 transition-all",
                    aiMode === 'text' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                  )}
                  onClick={() => setAIMode('text')}
                >
                  <Keyboard className="h-3.5 w-3.5" />
                  Text
                </button>
              </div>
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
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground"
                data-testid="close-chat-button"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {aiMode === 'voice' ? (
            <div className="p-4 space-y-4">
              {(speechError || !isSupported) && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Voice not available</p>
                    <p className="text-xs text-destructive/80 mt-1">
                      {speechError || "Your browser doesn't support speech recognition. Switch to text mode instead."}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => (isListening ? stopListening() : startListening())}
                className={cn(
                  "mx-auto flex h-20 w-20 items-center justify-center rounded-full transition-all",
                  isListening ? "bg-red-500 shadow-lg shadow-red-500/40" : "bg-primary shadow-lg hover:bg-primary/90"
                )}
                disabled={!isSupported}
                data-testid="voice-record-button"
              >
                <Mic className="h-8 w-8 text-primary-foreground" />
              </button>

              {transcript && (
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-foreground">
                  “{transcript}”
                </div>
              )}

              {(isProcessing || chatMutation.isPending || detectActionMutation.isPending) && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Thinking…
                </div>
              )}

              {showVoiceResponse && voiceResponse && (
                <div className="rounded-lg border border-border/60 bg-card/80 p-4">
                  <p className="text-sm text-foreground">{voiceResponse}</p>
                </div>
              )}

              {pendingAction && (
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={handleConfirmAction}
                    disabled={modifyTripMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {modifyTripMutation.isPending ? "Applying…" : "Confirm"}
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

              <button
                onClick={() => setAIMode('text')}
                className="w-full rounded-full border border-border bg-background px-4 py-3 text-left text-sm text-muted-foreground hover:text-foreground"
              >
                Tap to type instead…
              </button>
            </div>
          ) : (
            <div className="flex flex-col" style={{ maxHeight: '65vh' }}>
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
                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                        message.isUser
                          ? "bg-primary text-primary-foreground"
                          : message.isAction
                          ? "bg-secondary/20 border border-secondary"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {message.actionStatus === 'confirmed' && (
                        <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
                      )}
                      {message.actionStatus === 'rejected' && (
                        <AlertCircle className="w-4 h-4 inline mr-1 text-red-500" />
                      )}
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      <span className="mt-1 block text-[10px] opacity-60">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {pendingAction && (
                  <div className="flex justify-center gap-3 pt-2">
                    <Button
                      onClick={handleConfirmAction}
                      disabled={modifyTripMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {modifyTripMutation.isPending ? "Applying…" : "Confirm"}
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
                    <div className="rounded-2xl bg-muted px-4 py-3">
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

              <footer className="border-t border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me to modify your trip…"
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
                <button
                  onClick={() => setAIMode('voice')}
                  className="mt-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  Prefer talking? Switch to voice
                </button>
              </footer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
