import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { X, Send, Mic, CheckCircle, AlertCircle, Undo2, Volume2, VolumeX, Pause, Square, MapPin, Calendar, Heart, Wallet, Sparkles } from "lucide-react";
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
  audioUrl?: string;
  wasAudioInput?: boolean; // Track if user sent via audio
  tripPlanningForm?: TripPlanningData; // Trip planning form data
}

interface TripPlanningData {
  from?: string;
  to?: string;
  startDate?: string;
  endDate?: string;
  vibe?: string;
  budget?: number;
  customRequest?: string;
  advancedOptions?: {
    selectAll?: boolean;
    includeFlights?: boolean;
    autoBook?: boolean;
    localRecommendations?: boolean;
  };
}

const locations = [
  { value: "bangalore", label: "Bangalore, India" },
  { value: "goa", label: "Goa, India" },
  { value: "rishikesh", label: "Rishikesh, India" },
  { value: "udaipur", label: "Udaipur, India" },
  { value: "varanasi", label: "Varanasi, India" },
  { value: "varkala", label: "Varkala, India" },
];

// Trip Planning Form Component
function TripPlanningForm({ 
  data, 
  availableVibes, 
  onConfirm,
  allFieldsFilled 
}: { 
  data: TripPlanningData; 
  availableVibes: string[];
  onConfirm: () => void;
  allFieldsFilled: boolean;
}) {
  const missingFields = [];
  if (!data.from) missingFields.push("Origin");
  if (!data.to) missingFields.push("Destination");
  if (!data.startDate) missingFields.push("Start Date");
  if (!data.endDate) missingFields.push("End Date");
  if (!data.vibe) missingFields.push("Vibe");
  if (!data.budget) missingFields.push("Budget");

  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-2">
        {data.from && (
          <div className="flex items-center gap-1.5 text-green-600">
            <MapPin className="h-3 w-3" />
            <span className="font-medium">From:</span>
            <span>{data.from}</span>
          </div>
        )}
        {data.to && (
          <div className="flex items-center gap-1.5 text-green-600">
            <MapPin className="h-3 w-3" />
            <span className="font-medium">To:</span>
            <span>{data.to}</span>
          </div>
        )}
        {data.startDate && (
          <div className="flex items-center gap-1.5 text-green-600">
            <Calendar className="h-3 w-3" />
            <span className="font-medium">Start:</span>
            <span>{data.startDate}</span>
          </div>
        )}
        {data.endDate && (
          <div className="flex items-center gap-1.5 text-green-600">
            <Calendar className="h-3 w-3" />
            <span className="font-medium">End:</span>
            <span>{data.endDate}</span>
          </div>
        )}
        {data.vibe && (
          <div className="flex items-center gap-1.5 text-green-600">
            <Heart className="h-3 w-3" />
            <span className="font-medium">Vibe:</span>
            <span>{data.vibe}</span>
          </div>
        )}
        {data.budget && (
          <div className="flex items-center gap-1.5 text-green-600">
            <Wallet className="h-3 w-3" />
            <span className="font-medium">Budget:</span>
            <span>₹{data.budget.toLocaleString()}</span>
          </div>
        )}
      </div>
      
      {data.customRequest && (
        <div className="pt-2 border-t border-border/30">
          <div className="flex items-start gap-1.5 text-xs">
            <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Custom Request:</span>
              <p className="text-muted-foreground mt-0.5">{data.customRequest}</p>
            </div>
          </div>
        </div>
      )}
      
      {missingFields.length > 0 && (
        <div className="pt-2 text-muted-foreground">
          <p className="text-xs">Still needed: {missingFields.join(", ")}</p>
        </div>
      )}
      
      {allFieldsFilled && (
        <div className="pt-2">
          <Button
            onClick={onConfirm}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg"
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create My Perfect Plan
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            This will include flights, hotels, and local accommodations
          </p>
        </div>
      )}
    </div>
  );
}

export default function ChatModal() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      text: "Hi! I'm your AI travel assistant. I can help you modify your trip or answer questions. Try saying 'make it cheaper' or 'add a spa day'. I can also help you plan a new trip!",
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
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [mutedMessageId, setMutedMessageId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [lastMessageWasAudio, setLastMessageWasAudio] = useState(false);
  const currentlyAutoPlayingRef = useRef<HTMLAudioElement | null>(null);
  const [isPlanningTrip, setIsPlanningTrip] = useState(false);
  const [tripPlanningData, setTripPlanningData] = useState<TripPlanningData>({});
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [availableVibes, setAvailableVibes] = useState<string[]>([]);

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Pre-generate audio for welcome message on mount
  useEffect(() => {
    const welcomeMessage = messages.find(msg => msg.id === "welcome");
    if (welcomeMessage && !welcomeMessage.audioUrl && isChatOpen) {
      generateAudioUrl(welcomeMessage.text, welcomeMessage.id).then(audioUrl => {
        if (audioUrl) {
          setMessages(prev => prev.map(msg => 
            msg.id === welcomeMessage.id ? { ...msg, audioUrl } : msg
          ));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatOpen]);

  useEffect(() => {
    if (!isChatOpen) {
      stopListening();
      if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
      return;
    }

    return () => {
      stopListening();
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isChatOpen]);

  // Don't auto-process when listening stops - user will use stop button
  // Removed automatic processing on listening stop


  const handleClose = () => {
    stopListening();
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    setIsChatOpen(false);
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

  const generateAudioUrl = async (text: string, messageId: string) => {
    try {
      setLoadingAudioId(messageId);
      const blob = await api.textToSpeech(text);
      const audioUrl = URL.createObjectURL(blob);
      
      // Store audio element
      const audio = new Audio(audioUrl);
      audioRefs.current[messageId] = audio;
      
      audio.addEventListener('ended', () => {
        setPlayingMessageId(null);
      });
      
      audio.addEventListener('error', () => {
        console.error('Error playing audio for message:', messageId);
        setPlayingMessageId(null);
        setLoadingAudioId(null);
      });
      
      setLoadingAudioId(null);
      return audioUrl;
    } catch (error) {
      console.error('Error generating audio:', error);
      setLoadingAudioId(null);
      return null;
    }
  };

  const handleMuteUnmute = async (message: ChatMessage) => {
    // If currently playing and clicked, mute it
    if (playingMessageId === message.id) {
      const audio = audioRefs.current[message.id] || currentlyAutoPlayingRef.current;
      if (audio) {
        audio.pause();
        setMutedMessageId(message.id);
        setPlayingMessageId(null);
      }
      return;
    }
    
    // If muted and clicked, unmute and play
    if (mutedMessageId === message.id) {
      const audio = audioRefs.current[message.id];
      if (audio) {
        await audio.play();
        setMutedMessageId(null);
        setPlayingMessageId(message.id);
      }
      return;
    }
    
    // If not playing and not muted, start playing
    await toggleAudio(message);
  };

  const toggleAudio = async (message: ChatMessage) => {
    // Stop any currently playing audio (except if it's the same message)
    if (playingMessageId && playingMessageId !== message.id) {
      const currentAudio = audioRefs.current[playingMessageId] || currentlyAutoPlayingRef.current;
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      setPlayingMessageId(null);
      setMutedMessageId(null);
    }

    // If no audio URL exists, generate it
    if (!message.audioUrl) {
      const audioUrl = await generateAudioUrl(message.text, message.id);
      if (!audioUrl) return;
      
      // Update message with audio URL
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, audioUrl } : msg
      ));
    }

    // Play audio
    const audio = audioRefs.current[message.id];
    if (audio) {
      // Stop currently auto-playing if different
      if (currentlyAutoPlayingRef.current && currentlyAutoPlayingRef.current !== audio) {
        currentlyAutoPlayingRef.current.pause();
        currentlyAutoPlayingRef.current = null;
      }
      
      audio.currentTime = 0;
      await audio.play();
      setPlayingMessageId(message.id);
      setMutedMessageId(null);
    }
  };

  const autoPlayVoiceResponse = async (text: string, messageId: string) => {
    if (!text) return;
    
    // Use ElevenLabs instead of browser speech synthesis
    try {
      const blob = await api.textToSpeech(text);
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      // Store reference for mute control
      audioRefs.current[messageId] = audio;
      currentlyAutoPlayingRef.current = audio;
      setPlayingMessageId(messageId);
      
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
        currentlyAutoPlayingRef.current = null;
        setPlayingMessageId(null);
        setMutedMessageId(null);
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Error playing ElevenLabs audio:', e);
        URL.revokeObjectURL(audioUrl);
        currentlyAutoPlayingRef.current = null;
        setPlayingMessageId(null);
        setMutedMessageId(null);
      });
      
      // Auto-play the audio
      await audio.play();
      console.log('Playing ElevenLabs voice response');
    } catch (error) {
      console.error('Error generating ElevenLabs audio:', error);
      currentlyAutoPlayingRef.current = null;
      setPlayingMessageId(null);
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startListening(); // Start transcription
    } catch (error) {
      console.error('Error starting audio recording:', error);
      alert('Could not access microphone. Please allow microphone access.');
    }
  };

  const stopAudioRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    // Capture transcript before stopping
    const currentTranscript = transcript.trim();
    
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    stopListening(); // Stop transcription

    // Wait a moment for transcript to finalize, then send immediately
    setTimeout(() => {
      const finalTranscript = transcript.trim() || currentTranscript;
      if (finalTranscript) {
        handleSendVoiceMessageImmediate(finalTranscript);
      }
    }, 100);
  };

  const handleSendVoiceMessageImmediate = (messageText: string) => {
    if (!messageText.trim() || isProcessing) return;
    
    const trimmedText = messageText.trim();
    
    // Mark that this was from audio input
    setLastMessageWasAudio(true);
    
    // Add user message to chat immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: trimmedText,
      isUser: true,
      timestamp: new Date(),
      wasAudioInput: true,
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Get the recorded audio
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    console.log('Recorded audio size:', audioBlob.size, 'bytes');
    
    // Clear transcript and audio chunks
    resetTranscript();
    audioChunksRef.current = [];
    
    // Process the message immediately with text
    setIsProcessing(true);
    detectActionMutation.mutate(trimmedText);
  };

  const handleToggleVoiceRecording = () => {
    if (isRecording) {
      stopAudioRecording();
    } else {
      startAudioRecording();
    }
  };

  const generateTripFromChat = useMutation({
    mutationFn: api.generateTrip,
    onMutate: () => {
      setIsLoading(true);
      setIsProcessing(true);
    },
    onSuccess: (data) => {
      setCurrentTrip(data.trip);
      setCartItems([]);
      
      const successMsg: ChatMessage = {
        id: Date.now().toString(),
        text: "Perfect! Your itinerary has been created. Let me take you to your trip plan!",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, successMsg]);
      
      // Auto-play voice if last was audio
      if (lastMessageWasAudio) {
        autoPlayVoiceResponse(successMsg.text, successMsg.id).catch(err => {
          console.error('Error providing voice feedback:', err);
        });
        setLastMessageWasAudio(false);
      }
      
      // Navigate to itinerary page
      setTimeout(() => {
        setLocation("/itinerary");
        setIsChatOpen(false);
      }, 1500);
    },
    onError: (error) => {
      console.error("Error generating trip:", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        text: "I'm sorry, I encountered an error while creating your plan. Please try again or provide more details.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsProcessing(false);
    },
    onSettled: () => {
      setIsLoading(false);
      setIsProcessing(false);
    },
  });

  const detectActionMutation = useMutation({
    mutationFn: (message: string) => api.detectAction(message, currentTrip?.id),
    onSuccess: async (data, originalMessage) => {
      // If there's a response field (non-travel query), treat it as a chat response
      if (data.response && !data.hasAction) {
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          text: data.response,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);

        // Generate audio URL for this message in background
        generateAudioUrl(aiMessage.text, aiMessage.id).then(audioUrl => {
          if (audioUrl) {
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessage.id ? { ...msg, audioUrl } : msg
            ));
          }
        });

        // Auto-play voice if the last user message was audio input
        if (lastMessageWasAudio) {
          await autoPlayVoiceResponse(data.response, aiMessage.id);
          setLastMessageWasAudio(false);
        }
        
        setIsProcessing(false);
        return;
      }

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

        // Generate audio URL for confirmation message in background
        generateAudioUrl(confirmMsg.text, confirmMsg.id).then(audioUrl => {
          if (audioUrl) {
            setMessages(prev => prev.map(msg => 
              msg.id === confirmMsg.id ? { ...msg, audioUrl } : msg
            ));
          }
        });

        // Auto-play voice if the last user message was audio input
        if (lastMessageWasAudio) {
          await autoPlayVoiceResponse(data.confirmationMessage, confirmMsg.id);
          setLastMessageWasAudio(false);
        }
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

      // Generate audio URL for this message in background
      generateAudioUrl(successMsg.text, successMsg.id).then(audioUrl => {
        if (audioUrl) {
          setMessages(prev => prev.map(msg => 
            msg.id === successMsg.id ? { ...msg, audioUrl } : msg
          ));
        }
      });

      // Auto-play voice if the last user message was audio input
      if (lastMessageWasAudio) {
        autoPlayVoiceResponse(successMsg.text, successMsg.id).catch(err => {
          console.error('Error providing voice feedback:', err);
        });
        setLastMessageWasAudio(false);
      }

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
      
      // Generate audio URL for error message in background
      generateAudioUrl(errorMsg.text, errorMsg.id).then(audioUrl => {
        if (audioUrl) {
          setMessages(prev => prev.map(msg => 
            msg.id === errorMsg.id ? { ...msg, audioUrl } : msg
          ));
        }
      });
      
      setPendingAction(null);
    }
  });

  const chatMutation = useMutation({
    mutationFn: (message: string) => api.chat(message, currentTrip?.id),
    onSuccess: async (data) => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // Generate audio URL for this message in background
      generateAudioUrl(aiMessage.text, aiMessage.id).then(audioUrl => {
        if (audioUrl) {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessage.id ? { ...msg, audioUrl } : msg
          ));
        }
      });

      // Auto-play voice if the last user message was audio input
      if (lastMessageWasAudio) {
        await autoPlayVoiceResponse(data.response, aiMessage.id);
        setLastMessageWasAudio(false);
      }
    },
  });

  // Cleanup audio URLs on unmount
  useEffect(() => {
    return () => {
      // Stop all playing audio
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
      // Revoke object URLs for all messages
      setMessages(currentMessages => {
        currentMessages.forEach(msg => {
          if (msg.audioUrl) {
            URL.revokeObjectURL(msg.audioUrl);
          }
        });
        return currentMessages;
      });
    };
  }, []);

  const handleSendMessage = () => {
    const message = inputValue.trim();
    if (!message || isProcessing) return;

    // Mark that this was from text input
    setLastMessageWasAudio(false);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
      wasAudioInput: false,
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Add to conversation history
    setConversationHistory(prev => [...prev, message]);
    
    setInputValue("");
    setIsProcessing(true);

    // If already planning a trip, extract details from this message
    if (isPlanningTrip) {
      handleContinuePlanning(message);
    } else {
      // Check if user wants to plan a trip
      checkPlanningIntent(message);
    }
  };

  const checkPlanningIntent = async (message: string) => {
    try {
      const result = await api.detectItineraryPlanning(message, conversationHistory);
      
      if (result.wantsToPlan) {
        setIsPlanningTrip(true);
        
        // Merge extracted details
        const mergedData: TripPlanningData = {
          ...tripPlanningData,
          ...(result.extractedDetails.from && { from: result.extractedDetails.from }),
          ...(result.extractedDetails.to && { to: result.extractedDetails.to }),
          ...(result.extractedDetails.startDate && { startDate: result.extractedDetails.startDate }),
          ...(result.extractedDetails.endDate && { endDate: result.extractedDetails.endDate }),
          ...(result.extractedDetails.vibe && { vibe: result.extractedDetails.vibe }),
          ...(result.extractedDetails.budget && { budget: result.extractedDetails.budget }),
          ...(result.extractedDetails.customRequest && { customRequest: result.extractedDetails.customRequest }),
        };
        
        setTripPlanningData(mergedData);
        
        // If destination is provided, fetch vibes
        if (mergedData.to) {
          fetchVibesForDestination(mergedData.to);
        }
        
        // Show response and planning form
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          text: result.message || "I'd love to help you plan your trip! Let me gather some details.",
          isUser: false,
          timestamp: new Date(),
          tripPlanningForm: mergedData,
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Auto-play voice if last was audio
        if (lastMessageWasAudio) {
          await autoPlayVoiceResponse(aiMessage.text, aiMessage.id);
          setLastMessageWasAudio(false);
        }
        
        setIsProcessing(false);
      } else {
        // Not planning, proceed with normal action detection
        detectActionMutation.mutate(message);
      }
    } catch (error) {
      console.error("Error checking planning intent:", error);
      // Fallback to normal action detection
      detectActionMutation.mutate(message);
    }
  };

  const handleContinuePlanning = async (message: string) => {
    try {
      // Check if user is confirming advanced options (flights, hotels, accommodations)
      const lowerMessage = message.toLowerCase().trim();
      if (lowerMessage === "yes" || lowerMessage === "yep" || lowerMessage === "sure" || 
          lowerMessage.includes("yes") || lowerMessage.includes("confirm") || 
          lowerMessage.includes("plan") && (lowerMessage.includes("flight") || lowerMessage.includes("hotel"))) {
        // User confirmed, set advanced options and show create button
        const updatedData: TripPlanningData = {
          ...tripPlanningData,
          advancedOptions: {
            selectAll: true,
            includeFlights: true,
            autoBook: true,
            localRecommendations: true,
          },
        };
        setTripPlanningData(updatedData);
        
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          text: "Excellent! Everything is ready. Click the button below to create your perfect plan!",
          isUser: false,
          timestamp: new Date(),
          tripPlanningForm: updatedData,
        };
        setMessages(prev => [...prev, aiMessage]);
        
        if (lastMessageWasAudio) {
          await autoPlayVoiceResponse(aiMessage.text, aiMessage.id);
          setLastMessageWasAudio(false);
        }
        
        setIsProcessing(false);
        return;
      }
      
      const result = await api.extractTripDetails(
        message, 
        tripPlanningData,
        tripPlanningData.to
      );
      
      if (result.updated) {
        const updatedData: TripPlanningData = {
          ...tripPlanningData,
          ...(result.from && { from: result.from }),
          ...(result.to && { to: result.to }),
          ...(result.startDate && { startDate: result.startDate }),
          ...(result.endDate && { endDate: result.endDate }),
          ...(result.vibe && { vibe: result.vibe }),
          ...(result.budget && { budget: result.budget }),
          ...(result.customRequest && { customRequest: result.customRequest }),
        };
        
        setTripPlanningData(updatedData);
        
        // If destination changed, fetch vibes
        if (result.to && result.to !== tripPlanningData.to) {
          fetchVibesForDestination(result.to);
        }
        
        // Check if all required fields are filled
        const missing = getMissingFields(updatedData);
        
        if (missing.length === 0) {
          // All fields filled, check if advanced options confirmed
          if (!updatedData.advancedOptions) {
            // Ask for confirmation about flights, hotels, and accommodations
            const aiMessage: ChatMessage = {
              id: Date.now().toString(),
              text: "Perfect! I have all the details:\n\n" +
                `• From: ${updatedData.from}\n` +
                `• To: ${updatedData.to}\n` +
                `• Dates: ${updatedData.startDate} to ${updatedData.endDate}\n` +
                `• Vibe: ${updatedData.vibe}\n` +
                `• Budget: ₹${updatedData.budget?.toLocaleString()}\n` +
                (updatedData.customRequest ? `• Custom: ${updatedData.customRequest}\n` : '') +
                `\nWould you like me to plan flights, hotels, and local accommodations for your trip? Say "yes" to confirm.`,
              isUser: false,
              timestamp: new Date(),
              tripPlanningForm: updatedData,
            };
            setMessages(prev => [...prev, aiMessage]);
            
            if (lastMessageWasAudio) {
              await autoPlayVoiceResponse(aiMessage.text, aiMessage.id);
              setLastMessageWasAudio(false);
            }
          } else {
            // Advanced options confirmed, show create button
            const aiMessage: ChatMessage = {
              id: Date.now().toString(),
              text: "Excellent! Everything is ready. Click the button below to create your perfect plan!",
              isUser: false,
              timestamp: new Date(),
              tripPlanningForm: updatedData,
            };
            setMessages(prev => [...prev, aiMessage]);
            
            if (lastMessageWasAudio) {
              await autoPlayVoiceResponse(aiMessage.text, aiMessage.id);
              setLastMessageWasAudio(false);
            }
          }
        } else {
          // Still missing fields
          const aiMessage: ChatMessage = {
            id: Date.now().toString(),
            text: getMissingFieldsMessage(missing, updatedData),
            isUser: false,
            timestamp: new Date(),
            tripPlanningForm: updatedData,
          };
          setMessages(prev => [...prev, aiMessage]);
          
          if (lastMessageWasAudio) {
            await autoPlayVoiceResponse(aiMessage.text, aiMessage.id);
            setLastMessageWasAudio(false);
          }
        }
      } else {
        // No updates, treat as normal chat
        detectActionMutation.mutate(message);
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error("Error extracting trip details:", error);
      setIsProcessing(false);
      detectActionMutation.mutate(message);
    }
  };

  const fetchVibesForDestination = async (destination: string) => {
    try {
      const vibesData = await api.generateVibes(destination);
      if (vibesData?.vibes) {
        setAvailableVibes(vibesData.vibes);
      }
    } catch (error) {
      console.error("Error fetching vibes:", error);
    }
  };

  const getMissingFields = (data: TripPlanningData): string[] => {
    const missing: string[] = [];
    if (!data.from) missing.push("origin");
    if (!data.to) missing.push("destination");
    if (!data.startDate) missing.push("start date");
    if (!data.endDate) missing.push("end date");
    if (!data.vibe) missing.push("vibe");
    if (!data.budget) missing.push("budget");
    return missing;
  };

  const getMissingFieldsMessage = (missing: string[], data: TripPlanningData): string => {
    let message = "I need a few more details:\n";
    if (missing.includes("origin")) message += "• Where are you traveling from?\n";
    if (missing.includes("destination")) message += "• Where would you like to go?\n";
    if (missing.includes("start date")) message += "• When does your trip start?\n";
    if (missing.includes("end date")) message += "• When does your trip end?\n";
    if (missing.includes("vibe")) message += "• What kind of vibe are you looking for? (e.g., Beach & Chill, Adventure Sports, Cultural Heritage)\n";
    if (missing.includes("budget")) message += "• What's your budget range?\n";
    
    if (data.from) message += `\n✓ From: ${data.from}\n`;
    if (data.to) message += `✓ To: ${data.to}\n`;
    if (data.startDate) message += `✓ Start: ${data.startDate}\n`;
    if (data.endDate) message += `✓ End: ${data.endDate}\n`;
    if (data.vibe) message += `✓ Vibe: ${data.vibe}\n`;
    if (data.budget) message += `✓ Budget: ₹${data.budget}\n`;
    
    return message;
  };

  const handleConfirmPlanning = () => {
    // Set default advanced options if not set
    const advancedOptions = tripPlanningData.advancedOptions || {
      selectAll: true,
      includeFlights: true,
      autoBook: true,
      localRecommendations: true,
    };
    
    const tripRequest = {
      from: tripPlanningData.from || "bangalore",
      to: tripPlanningData.to || "goa",
      startDate: tripPlanningData.startDate || new Date().toISOString().split('T')[0],
      endDate: tripPlanningData.endDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      theme: tripPlanningData.vibe || availableVibes[0] || "Adventure",
      budget: tripPlanningData.budget || 135000,
      customRequest: tripPlanningData.customRequest,
      advancedOptions,
    };
    
    // Add confirmation message
    const confirmMsg: ChatMessage = {
      id: Date.now().toString(),
      text: "Great! I'm creating your perfect plan now. This may take a moment...",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMsg]);
    
    // Generate trip
    generateTripFromChat.mutate(tripRequest);
    
    // Reset planning state
    setIsPlanningTrip(false);
    setTripPlanningData({});
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
    
    // Generate audio URL for undo message in background
    generateAudioUrl(undoMsg.text, undoMsg.id).then(audioUrl => {
      if (audioUrl) {
        setMessages(prev => prev.map(msg => 
          msg.id === undoMsg.id ? { ...msg, audioUrl } : msg
        ));
      }
    });
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
                Type or speak your request
              </p>
            </div>
            <div className="flex items-center gap-1">
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

          {/* Unified chat interface */}
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
                        
                        {/* Trip Planning Form */}
                        {message.tripPlanningForm && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <TripPlanningForm
                              data={message.tripPlanningForm}
                              availableVibes={availableVibes}
                              onConfirm={handleConfirmPlanning}
                              allFieldsFilled={getMissingFields(message.tripPlanningForm).length === 0}
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] opacity-60">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!message.isUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMuteUnmute(message)}
                              disabled={loadingAudioId === message.id}
                              className="h-6 w-6 p-0 hover:bg-primary/10 disabled:opacity-50"
                              title={
                                loadingAudioId === message.id 
                                  ? "Generating audio..." 
                                  : mutedMessageId === message.id
                                  ? "Unmute / Play audio"
                                  : playingMessageId === message.id 
                                  ? "Mute / Stop audio" 
                                  : "Play audio"
                              }
                            >
                              {loadingAudioId === message.id ? (
                                <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : mutedMessageId === message.id ? (
                                <VolumeX className="h-3 w-3" />
                              ) : playingMessageId === message.id ? (
                                <Volume2 className="h-3 w-3" />
                              ) : (
                                <Volume2 className="h-3 w-3 opacity-50" />
                              )}
                            </Button>
                          )}
                        </div>
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
                {(isProcessing || chatMutation.isPending || detectActionMutation.isPending) && (
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
                {isRecording && transcript && (
                  <div className="mb-2 rounded-lg border border-primary/30 bg-primary/5 p-2 text-sm text-foreground">
                    <p className="font-medium mb-1 text-xs text-primary">Recording...</p>
                    <p className="text-xs">"{transcript}"</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me to modify your trip…"
                    className="flex-1 rounded-full bg-background"
                    disabled={isProcessing || modifyTripMutation.isPending || isRecording}
                    data-testid="chat-input"
                  />
                  {isSupported && (
                    <Button
                      onClick={handleToggleVoiceRecording}
                      disabled={isProcessing || modifyTripMutation.isPending}
                      className={cn(
                        "rounded-full w-10 h-10 p-0",
                        isRecording 
                          ? "bg-red-500 hover:bg-red-600" 
                          : "bg-secondary hover:bg-secondary/80"
                      )}
                      title={isRecording ? "Stop recording" : "Start voice recording"}
                    >
                      {isRecording ? (
                        <Square className="h-4 w-4 text-white" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isProcessing || modifyTripMutation.isPending || isRecording}
                    className="rounded-full w-10 h-10 p-0"
                    data-testid="send-button"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
