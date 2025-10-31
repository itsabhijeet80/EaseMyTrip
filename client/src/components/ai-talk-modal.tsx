import { X, MessageCircle, Mic, AlertCircle, Check } from "lucide-react";
import { useTripStore } from "@/hooks/use-trip-store";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AITalkModal() {
  const { isAITalkOpen, setIsAITalkOpen, setIsChatOpen, currentTrip } = useTripStore();
  const [response, setResponse] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error: speechError
  } = useSpeechRecognition();

  // Chat mutation for voice responses
  const chatMutation = useMutation({
    mutationFn: (message: string) => api.chat(message, currentTrip?.id),
    onSuccess: (data) => {
      setResponse(data.response);
      setShowResponse(true);
      
      // Auto-hide response after 5 seconds
      setTimeout(() => {
        setShowResponse(false);
      }, 5000);

      // Speak the response if browser supports it
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  });

  // Action detection mutation
  const detectActionMutation = useMutation({
    mutationFn: (message: string) => api.detectAction(message, currentTrip?.id),
    onSuccess: (data) => {
      if (data.hasAction) {
        // If action detected, show confirmation in voice
        const confirmMsg = data.confirmationMessage || `I can ${data.action}. Would you like me to do that?`;
        setResponse(confirmMsg);
        setShowResponse(true);
        
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(confirmMsg);
          window.speechSynthesis.speak(utterance);
        }
        
        // For demo, we'll just chat normally since voice confirmation is complex
        chatMutation.mutate(transcript);
      } else {
        // No action, just chat
        chatMutation.mutate(transcript);
      }
    }
  });

  // Process transcript when user stops speaking
  useEffect(() => {
    if (!isListening && transcript && transcript.length > 5) {
      // User finished speaking, process the command
      detectActionMutation.mutate(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  if (!isAITalkOpen) return null;

  const handleStartListening = () => {
    if (isListening) {
      stopListening();
    } else {
      setShowResponse(false);
      setResponse("");
      startListening();
    }
  };

  const handleSwitchToChat = () => {
    if (isListening) {
      stopListening();
    }
    setIsAITalkOpen(false);
    setIsChatOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end backdrop-blur-sm transition-all duration-300 slide-in">
      <div className="bg-card w-full max-w-lg mx-auto rounded-t-2xl shadow-2xl h-[85%] flex flex-col border-t border-border">
        {/* Header */}
        <header className="p-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Voice Assistant</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-xs text-muted-foreground">
                  {isListening ? 'Listening...' : isSupported ? 'Ready' : 'Not supported'}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAITalkOpen(false)}
            className="text-muted-foreground hover:text-foreground"
            data-testid="close-talk-button"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        {/* Main Content - Microphone and Instructions */}
        <div className="flex-grow flex flex-col items-center justify-center p-8 space-y-6">
          {/* Error Message */}
          {(speechError || !isSupported) && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start space-x-2 max-w-sm">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-destructive font-medium">Voice not available</p>
                <p className="text-xs text-destructive/80 mt-1">
                  {speechError || 'Your browser doesn\'t support voice input. Please use chat mode instead.'}
                </p>
              </div>
            </div>
          )}

          {/* Microphone Button with Wave Animation */}
          <button
            onClick={handleStartListening}
            className="relative group"
            disabled={!isSupported}
            data-testid="voice-record-button"
          >
            {/* Animated Waves */}
            {isListening && (
              <>
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              </>
            )}
            
            {/* Microphone Circle */}
            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
              !isSupported 
                ? 'bg-muted cursor-not-allowed'
                : isListening 
                ? 'bg-red-500 shadow-2xl shadow-red-500/50 scale-110' 
                : 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-xl group-hover:scale-110 group-hover:shadow-2xl'
            }`}>
              <Mic className="h-16 w-16 text-white" />
            </div>
          </button>

          {/* Transcript Display */}
          {transcript && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-md">
              <p className="text-sm text-foreground text-center">"{transcript}"</p>
            </div>
          )}

          {/* Loading */}
          {(chatMutation.isPending || detectActionMutation.isPending) && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          )}

          {/* Response Display */}
          {showResponse && response && (
            <div className="bg-secondary/20 border border-secondary/30 rounded-lg p-4 max-w-md">
              <div className="flex items-start space-x-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{response}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {isListening ? "I'm listening..." : "Tap to speak"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {isListening 
                ? "Ask me anything about your trip" 
                : "Press the microphone and start speaking"}
            </p>
          </div>

          {/* Voice Hints */}
          {!isListening && !transcript && isSupported && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Try saying:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Show my itinerary', 'What\'s the total cost?', 'Add a spa day'].map((hint) => (
                  <span key={hint} className="text-xs bg-muted px-3 py-1 rounded-full">
                    "{hint}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Wave Animation Container */}
          {isListening && (
            <div className="flex items-center justify-center space-x-1 h-16">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={`wave-bar-${i}-${Date.now()}`}
                  className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-wave"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    height: '100%'
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Input Bar to Switch to Chat */}
        <footer className="p-4 border-t border-border bg-muted/20">
          <button
            onClick={handleSwitchToChat}
            className="w-full flex items-center space-x-3 p-4 bg-card border border-border rounded-xl hover:bg-accent transition-all duration-200 group"
            data-testid="switch-to-chat-button"
          >
            <MessageCircle className="h-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-grow text-left">
              Prefer to type? Switch to chat mode
            </span>
            <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
              →
            </div>
          </button>
        </footer>
      </div>
    </div>
  );
}
