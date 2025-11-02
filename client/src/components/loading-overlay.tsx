import { useEffect, useState, useRef } from "react";
import { useTripStore } from "@/hooks/use-trip-store";

export default function LoadingOverlay() {
  const isLoading = useTripStore(state => state.isLoading);
  const [progress, setProgress] = useState(0);
  const fastProgressRef = useRef<NodeJS.Timeout | null>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Reset progress when loading starts
      setProgress(0);
      
      // Fast progress to 90% in ~2.5 seconds
      const targetProgress = 90;
      const duration = 2500; // 2.5 seconds
      const steps = 50; // Number of animation steps
      const stepDuration = duration / steps;
      const progressPerStep = targetProgress / steps;
      
      let currentProgress = 0;
      
      // Clear any existing intervals
      if (fastProgressRef.current) {
        clearInterval(fastProgressRef.current);
      }
      
      fastProgressRef.current = setInterval(() => {
        currentProgress += progressPerStep;
        if (currentProgress >= targetProgress) {
          currentProgress = targetProgress;
          if (fastProgressRef.current) {
            clearInterval(fastProgressRef.current);
            fastProgressRef.current = null;
          }
        }
        setProgress(currentProgress);
      }, stepDuration);
      
    } else {
      // When loading completes, quickly animate to 100%
      // Clear any fast progress intervals
      if (fastProgressRef.current) {
        clearInterval(fastProgressRef.current);
        fastProgressRef.current = null;
      }
      
      // Animate to 100%
      setProgress(100);
      
      // Hide overlay after animation completes
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
      
      completionTimeoutRef.current = setTimeout(() => {
        setProgress(0);
      }, 600);
    }
    
    return () => {
      if (fastProgressRef.current) {
        clearInterval(fastProgressRef.current);
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
    };
  }, [isLoading]);

  // Show overlay if loading OR if we're animating the completion (progress > 0)
  if (!isLoading && progress === 0) return null;

  return (
    <div className="absolute inset-0 bg-card/90 z-50 flex flex-col justify-center items-center backdrop-blur-sm">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      <p className="mt-4 text-lg font-semibold text-foreground">Generating your personalized plan...</p>
      <p className="text-sm text-muted-foreground">This may take a moment.</p>
      <div className="mt-4 w-64 sm:w-80 bg-muted rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-primary to-primary/80 h-2.5 rounded-full transition-all ease-out"
          style={{
            width: `${progress}%`,
            transitionDuration: isLoading && progress < 90 
              ? '60ms' 
              : !isLoading && progress === 100
                ? '400ms'
                : '100ms',
            transitionTimingFunction: 'ease-out'
          }}
        ></div>
      </div>
    </div>
  );
}
