import { useEffect, useRef } from "react";
import { ArrowLeft, Share, MapPin, Clock, DollarSign, Star, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTripStore } from "@/hooks/use-trip-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CartItem } from "@shared/schema";

export default function Itinerary() {
  const [, setLocation] = useLocation();
  const { currentTrip, selectedDay, setSelectedDay, cartItems, setCartItems } = useTripStore();
  const queryClient = useQueryClient();
  const dayRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Fetch cart items when trip is loaded
  const { data: cartData } = useQuery({
    queryKey: ["/api/trips", currentTrip?.id, "cart"],
    queryFn: () => currentTrip ? api.getCartItems(currentTrip.id) : Promise.resolve([]),
    enabled: !!currentTrip?.id,
  });

  // Mutation to update cart item inclusion status
  const updateCartItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CartItem> }) => 
      api.updateCartItem(id, updates),
    onSuccess: () => {
      if (currentTrip) {
        queryClient.invalidateQueries({ queryKey: ["/api/trips", currentTrip.id, "cart"] });
      }
    },
  });

  useEffect(() => {
    if (cartData) {
      setCartItems(cartData);
    }
  }, [cartData, setCartItems]);

  // Smooth scroll to selected day when user clicks a tab
  useEffect(() => {
    if (dayRefs.current[selectedDay]) {
      dayRefs.current[selectedDay]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [selectedDay]);

  if (!currentTrip) {
    return (
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">No Trip Found</h2>
          <p className="text-muted-foreground mb-4">Please create a trip first</p>
          <Button onClick={() => setLocation("/")} data-testid="go-home-button">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const tripDays = currentTrip.days as any[] || [];

  const getIconForType = (type: string) => {
    switch (type) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'activity': return '🎯';
      default: return '📍';
    }
  };

  const getDayStats = (dayNumber: number) => {
    const dayCartItems = cartItems.filter(item => item.dayNumber === dayNumber);
    return {
      activities: dayCartItems.length,
      cost: dayCartItems.filter(item => item.included).reduce((sum, item) => sum + item.price, 0),
      duration: "8hr" // Mock duration
    };
  };

  return (
    <main className="flex-grow overflow-y-auto custom-scrollbar p-4 sm:p-6">
      {/* Header - Minimal */}
      <header className="mb-6 sticky top-0 z-20 bg-background/95 backdrop-blur-md pb-4 pt-2 -mt-2 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-border/60">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2 hover:bg-muted rounded-full transition-all"
            data-testid="back-button"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center flex-1">
            {currentTrip.title}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-muted rounded-full transition-all"
            data-testid="share-button"
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Day Tabs Navigation - Minimal */}
        <nav className="flex overflow-x-auto custom-scrollbar pb-2 space-x-1 -mx-1 px-1">
          {tripDays.map((day) => (
            <Button
              key={day.day_number}
              variant="ghost"
              onClick={() => setSelectedDay(day.day_number)}
              className={cn(
                "day-tab px-4 py-2 text-sm font-medium whitespace-nowrap transition-all rounded-md",
                selectedDay === day.day_number
                  ? "text-primary bg-primary/10 border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              data-testid={`day-tab-${day.day_number}`}
            >
              Day {day.day_number}
            </Button>
          ))}
        </nav>
      </header>
      
      {/* All Days Content - Minimal & Polished */}
      <div className="space-y-6 pb-8">
        {tripDays.map((day) => {
          const dayCartItems = cartItems.filter(item => item.dayNumber === day.day_number);
          const dayStats = getDayStats(day.day_number);
          const isActive = selectedDay === day.day_number;
          
          return (
            <div
              key={day.day_number}
              ref={(el) => (dayRefs.current[day.day_number] = el)}
              className={cn(
                "scroll-mt-32 space-y-4",
                isActive && "ring-1 ring-primary/30 rounded-xl -m-1 p-1"
              )}
              data-day={day.day_number}
            >
              {/* Day Theme Header - Minimal */}
              <div className={cn(
                "rounded-xl p-5 border transition-all",
                isActive 
                  ? "bg-card border-primary/40 shadow-sm"
                  : "bg-card border-border hover:border-primary/20"
              )}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm",
                      isActive 
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}>
                      {day.day_number}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Day {day.day_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                    <span className="font-medium">{dayStats.activities} activities</span>
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                  {day.theme}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{day.ai_summary}</p>
              </div>

              {/* Activities - Minimal */}
              <div className="space-y-3">
                {dayCartItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "bg-card border rounded-lg p-4 transition-all hover:border-primary/30",
                      !item.included && "opacity-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-muted">
                        {getIconForType(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <h3 className="font-semibold text-foreground text-sm">
                            {item.title}
                          </h3>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.included ?? true}
                              onChange={(e) => {
                                const newIncluded = e.target.checked;
                                setCartItems(cartItems.map(cartItem => 
                                  cartItem.id === item.id 
                                    ? { ...cartItem, included: newIncluded }
                                    : cartItem
                                ));
                                updateCartItemMutation.mutate({
                                  id: item.id,
                                  updates: { included: newIncluded }
                                });
                              }}
                              className="w-4 h-4 rounded border-2 border-primary/30 text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
                              data-testid={`item-checkbox-${item.id}`}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                          {item.details}
                        </p>
                        {item.provider && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {item.provider}
                          </p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            1 hour
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DollarSign className="w-3 h-3" />
                            ₹{item.price}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="w-3 h-3 fill-primary text-primary" />
                            4.5
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Day Summary - Minimal */}
              <div className="bg-muted/30 border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span>Day {day.day_number} Summary</span>
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{dayStats.activities}</div>
                    <div className="text-xs text-muted-foreground">Activities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">₹{dayStats.cost}</div>
                    <div className="text-xs text-muted-foreground">Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{dayStats.duration}</div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
