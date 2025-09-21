import { useTripStore } from "@/hooks/use-trip-store";

export default function LoadingOverlay() {
  const isLoading = useTripStore(state => state.isLoading);
  
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-card/90 z-50 flex flex-col justify-center items-center backdrop-blur-sm">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      <p className="mt-4 text-lg font-semibold text-foreground">Generating your personalized plan...</p>
      <p className="text-sm text-muted-foreground">This may take a moment.</p>
      <div className="mt-4 w-48 bg-muted rounded-full h-2">
        <div className="bg-primary h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
      </div>
    </div>
  );
}
