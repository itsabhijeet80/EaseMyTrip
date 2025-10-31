import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  );
}

export function TripCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function ItineraryDaySkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <Skeleton className="h-6 w-1/2 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VibesSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-32 mb-3" />
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="w-[180px] h-16 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="w-[180px] h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BudgetInsightSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-lg p-3 border border-border">
            <Skeleton className="h-6 w-full mb-1" />
            <Skeleton className="h-3 w-2/3 mx-auto" />
          </div>
        ))}
      </div>
      
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
        <Skeleton className="h-6 w-40 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <Skeleton className="h-8 w-12 mx-auto mb-2" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      
      {/* Sections */}
      {[1, 2, 3].map((section) => (
        <div key={section} className="bg-card border border-border rounded-xl p-4">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}









