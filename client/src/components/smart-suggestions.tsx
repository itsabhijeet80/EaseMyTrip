import { useState } from "react";
import { Sparkles, TrendingUp, MapPin, Calendar, X, Plus, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/loading-skeleton";
import { cn } from "@/lib/utils";

interface SmartSuggestionsProps {
  tripId: string;
  dayNumber?: number;
  onClose?: () => void;
  inline?: boolean;
}

export default function SmartSuggestions({ tripId, dayNumber, onClose, inline = false }: SmartSuggestionsProps) {
  const [selectedTab, setSelectedTab] = useState<'recommendations' | 'insights' | 'popular'>('recommendations');

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/trips", tripId, "recommendations", dayNumber],
    queryFn: () => api.getRecommendations(tripId, dayNumber),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-3", inline ? "" : "p-4")}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-3">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Unable to load recommendations</p>
      </div>
    );
  }

  const Container = inline ? 'div' : 'div';
  const containerProps = inline ? {} : { className: "fixed inset-0 bg-black/50 z-40 flex items-end backdrop-blur-sm" };

  return (
    <Container {...containerProps}>
      <div className={cn(
        inline 
          ? "w-full" 
          : "bg-card w-full max-w-lg mx-auto rounded-t-2xl shadow-2xl h-[85%] flex flex-col border-t border-border"
      )}>
        {/* Header */}
        {!inline && (
          <header className="p-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-t-2xl">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-amber-600" />
                Smart Suggestions
              </h2>
              <p className="text-xs text-muted-foreground">
                {dayNumber ? `Personalized for Day ${dayNumber}` : 'For your entire trip'}
              </p>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </header>
        )}

        {/* Tabs */}
        <div className={cn("flex border-b border-border", inline ? "mb-4" : "")}>
          <button
            onClick={() => setSelectedTab('recommendations')}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              selectedTab === 'recommendations'
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MapPin className="w-3 h-3 inline mr-1" />
            Activities
          </button>
          <button
            onClick={() => setSelectedTab('popular')}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              selectedTab === 'popular'
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Popular
          </button>
          <button
            onClick={() => setSelectedTab('insights')}
            className={cn(
              "flex-1 py-2 text-xs font-medium transition-colors",
              selectedTab === 'insights'
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="w-3 h-3 inline mr-1" />
            Insights
          </button>
        </div>

        {/* Content */}
        <div className={cn("overflow-y-auto custom-scrollbar", inline ? "" : "flex-1 p-4")}>
          {/* Recommendations Tab */}
          {selectedTab === 'recommendations' && (
            <div className="space-y-3">
              {data.recommendations?.map((rec: any, idx: number) => (
                <div key={idx} className="bg-card border border-border rounded-lg p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm">{rec.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                    <span className="ml-2 text-sm font-bold text-primary whitespace-nowrap">₹{rec.price}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded capitalize">{rec.type}</span>
                      <span className="bg-muted px-2 py-0.5 rounded capitalize">{rec.timing}</span>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  {rec.reasoning && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                      <Sparkles className="w-3 h-3 inline mr-1 text-amber-600" />
                      <span className="text-amber-900">{rec.reasoning}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Popular Tab */}
          {selectedTab === 'popular' && (
            <div className="space-y-3">
              {data.peopleAlsoAdded?.map((item: any, idx: number) => (
                <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground text-sm flex-1">{item.title}</h4>
                    <div className="flex items-center ml-2">
                      <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                      <span className="text-sm font-bold text-blue-700">{item.percentage}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-900">{item.reason}</p>
                  <Button size="sm" variant="outline" className="w-full mt-3 text-xs h-7 border-blue-300">
                    <Plus className="w-3 h-3 mr-1" />
                    Add to Trip
                  </Button>
                </div>
              ))}
              
              {data.sequences && data.sequences.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Perfect Day Sequences</h3>
                  {data.sequences.map((seq: any, idx: number) => (
                    <div key={idx} className="bg-card border border-border rounded-lg p-3 mb-3">
                      <h4 className="font-medium text-foreground text-sm mb-2">{seq.title}</h4>
                      <div className="space-y-1 mb-2">
                        {seq.activities.map((activity: string, aIdx: number) => (
                          <div key={aIdx} className="flex items-center text-xs text-muted-foreground">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2 text-[10px] font-bold">
                              {aIdx + 1}
                            </span>
                            {activity}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground italic">{seq.reasoning}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Insights Tab */}
          {selectedTab === 'insights' && (
            <div className="space-y-3">
              {data.localInsights?.map((insight: any, idx: number) => (
                <div key={idx} className={cn(
                  "rounded-lg p-3 border",
                  insight.type === 'weather' ? "bg-blue-50 border-blue-200" :
                  insight.type === 'event' ? "bg-purple-50 border-purple-200" :
                  "bg-green-50 border-green-200"
                )}>
                  <div className="flex items-start">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                      insight.type === 'weather' ? "bg-blue-100" :
                      insight.type === 'event' ? "bg-purple-100" :
                      "bg-green-100"
                    )}>
                      {insight.type === 'weather' ? '🌤️' : insight.type === 'event' ? '🎉' : '💡'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm mb-1">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                      <p className="text-xs font-medium text-primary">{insight.relevance}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}









