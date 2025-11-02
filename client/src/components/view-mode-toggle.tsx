import { Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTripStore } from "@/hooks/use-trip-store";
import { cn } from "@/lib/utils";

export default function ViewModeToggle() {
  const viewMode = useTripStore(state => state.viewMode);
  const setViewMode = useTripStore(state => state.setViewMode);

  return (
    <div className="flex items-center justify-center mb-4 px-6">
      <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm border border-border rounded-full p-0.5 shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewMode('mobile')}
          className={cn(
            "rounded-full px-2 py-1 h-auto transition-all",
            viewMode === 'mobile'
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          title="Mobile View"
        >
          <Smartphone className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs font-medium">Mobile</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewMode('desktop')}
          className={cn(
            "rounded-full px-2 py-1 h-auto transition-all",
            viewMode === 'desktop'
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          title="Desktop View"
        >
          <Monitor className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs font-medium">Desktop</span>
        </Button>
      </div>
    </div>
  );
}

