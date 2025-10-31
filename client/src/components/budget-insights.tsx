import { useState } from "react";
import { TrendingDown, TrendingUp, Lightbulb, Gem, X, ArrowRight, DollarSign } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BudgetInsightsProps {
  tripId: string;
  onClose: () => void;
}

export default function BudgetInsights({ tripId, onClose }: BudgetInsightsProps) {
  const [selectedTab, setSelectedTab] = useState<'optimizations' | 'alternatives' | 'gems'>('optimizations');

  const { data: insights, isLoading, isError } = useMutation({
    mutationFn: () => api.optimizeBudget(tripId),
  });

  // Trigger the optimization on mount
  useState(() => {
    insights || isLoading || isError ? null : api.optimizeBudget(tripId).then(() => {});
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end backdrop-blur-sm">
        <div className="bg-card w-full max-w-lg mx-auto rounded-t-2xl shadow-2xl h-[85%] flex flex-col border-t border-border p-6">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Analyzing your budget...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !insights) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end backdrop-blur-sm">
        <div className="bg-card w-full max-w-lg mx-auto rounded-t-2xl shadow-2xl h-[85%] flex flex-col border-t border-border p-6">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-destructive mb-4">Failed to analyze budget</p>
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const data = insights as any;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg mx-auto rounded-t-2xl shadow-2xl h-[85%] flex flex-col border-t border-border">
        {/* Header */}
        <header className="p-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Budget Optimizer
            </h2>
            <p className="text-xs text-muted-foreground">AI-powered savings suggestions</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        {/* Current Breakdown */}
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground mb-2">Current Spending</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-card rounded-lg border border-border">
              <div className="text-lg font-bold text-primary">₹{data.currentBreakdown?.hotels || 0}</div>
              <div className="text-xs text-muted-foreground">Hotels</div>
            </div>
            <div className="text-center p-2 bg-card rounded-lg border border-border">
              <div className="text-lg font-bold text-secondary">₹{data.currentBreakdown?.flights || 0}</div>
              <div className="text-xs text-muted-foreground">Flights</div>
            </div>
            <div className="text-center p-2 bg-card rounded-lg border border-border">
              <div className="text-lg font-bold text-primary">₹{data.currentBreakdown?.activities || 0}</div>
              <div className="text-xs text-muted-foreground">Activities</div>
            </div>
          </div>
          <div className="mt-3 text-center p-2 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">₹{data.currentBreakdown?.total || 0}</div>
            <div className="text-xs text-muted-foreground">Total Budget</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setSelectedTab('optimizations')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              selectedTab === 'optimizations'
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingDown className="w-4 h-4 inline mr-1" />
            Smart Swaps
          </button>
          <button
            onClick={() => setSelectedTab('alternatives')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              selectedTab === 'alternatives'
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Alternatives
          </button>
          <button
            onClick={() => setSelectedTab('gems')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              selectedTab === 'gems'
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Gem className="w-4 h-4 inline mr-1" />
            Hidden Gems
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Smart Swaps */}
          {selectedTab === 'optimizations' && (
            <div className="space-y-3">
              {data.optimizations?.map((opt: any, idx: number) => (
                <div key={idx} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground text-sm">{opt.title}</h4>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      Save ₹{opt.savings}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{opt.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground line-through">{opt.currentItem}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="text-primary font-medium">{opt.suggestedItem}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      Apply Swap
                    </Button>
                  </div>
                </div>
              ))}
              {data.insights && data.insights.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <Lightbulb className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      {data.insights.map((insight: string, idx: number) => (
                        <p key={idx} className="text-xs text-blue-900">{insight}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Alternatives */}
          {selectedTab === 'alternatives' && (
            <div className="space-y-3">
              {data.alternatives?.budget && (
                <div className="bg-card border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">Budget Option</h4>
                    <span className="text-lg font-bold text-primary">₹{data.alternatives.budget.totalCost}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{data.alternatives.budget.description}</p>
                  <Button size="sm" variant="outline" className="w-full mt-3 text-xs">
                    Switch to Budget
                  </Button>
                </div>
              )}
              {data.alternatives?.standard && (
                <div className="bg-card border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground flex items-center">
                      Standard Option
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Current</span>
                    </h4>
                    <span className="text-lg font-bold text-primary">₹{data.alternatives.standard.totalCost}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{data.alternatives.standard.description}</p>
                </div>
              )}
              {data.alternatives?.luxury && (
                <div className="bg-card border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">Luxury Option</h4>
                    <span className="text-lg font-bold text-primary">₹{data.alternatives.luxury.totalCost}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{data.alternatives.luxury.description}</p>
                  <Button size="sm" variant="outline" className="w-full mt-3 text-xs">
                    Upgrade to Luxury
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Hidden Gems */}
          {selectedTab === 'gems' && (
            <div className="space-y-3">
              {data.hiddenGems?.map((gem: any, idx: number) => (
                <div key={idx} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <Gem className="w-4 h-4 text-amber-600 mr-2" />
                      <h4 className="font-semibold text-foreground text-sm">{gem.title}</h4>
                    </div>
                    <span className="text-sm font-bold text-primary">₹{gem.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{gem.description}</p>
                  <span className="inline-block text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                    {gem.category}
                  </span>
                  <Button size="sm" variant="outline" className="w-full mt-3 text-xs">
                    Add to Trip
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}









