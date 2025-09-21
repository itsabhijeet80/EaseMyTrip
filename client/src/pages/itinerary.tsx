import { useEffect, useState } from "react";
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
  const currentDay = tripDays.find(day => day.day_number === selectedDay) || tripDays[0];
  const dayCartItems = cartItems.filter(item => item.dayNumber === selectedDay);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'activity': return '🎯';
      default: return '📍';
    }
  };

  const dayStats = {
    activities: dayCartItems.length,
    cost: dayCartItems.filter(item => item.included).reduce((sum, item) => sum + item.price, 0),
    duration: "8hr" // Mock duration
  };

  return (
    <main className="flex-grow overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2 hover:bg-muted rounded-full"
            data-testid="back-button"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-foreground text-center flex-1">
            {currentTrip.title}
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-muted rounded-full"
            data-testid="share-button"
          >
            <Share className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Day Tabs Navigation */}
        <nav className="flex overflow-x-auto custom-scrollbar pb-2 space-x-1">
          {tripDays.map((day) => (
            <Button
              key={day.day_number}
              variant="ghost"
              onClick={() => setSelectedDay(day.day_number)}
              className={cn(
                "day-tab px-4 py-2 text-sm font-medium whitespace-nowrap transition-all",
                selectedDay === day.day_number
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid={`day-tab-${day.day_number}`}
            >
              Day {day.day_number}
            </Button>
          ))}
        </nav>
      </header>
      
      {/* Day Content */}
      <div className="space-y-4">
        {currentDay && (
          <>
            {/* Day Theme Header */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-4">
              <h2 className="text-xl font-bold text-foreground">{currentDay.theme}</h2>
              <p className="text-muted-foreground mt-2 text-sm">{currentDay.ai_summary}</p>
            </div>

            {/* Activities */}
            {dayCartItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "bg-card border border-border rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow",
                  !item.included && "opacity-50"
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-lg">{getIconForType(item.type)}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={item.included ?? true}
                          onChange={(e) => {
                            // Update local state immediately for responsive UI
                            const newIncluded = e.target.checked;
                            setCartItems(cartItems.map(cartItem => 
                              cartItem.id === item.id 
                                ? { ...cartItem, included: newIncluded }
                                : cartItem
                            ));
                            // Update on server
                            updateCartItemMutation.mutate({
                              id: item.id,
                              updates: { included: newIncluded }
                            });
                          }}
                          className="rounded border-border text-primary focus:ring-ring"
                          data-testid={`item-checkbox-${item.id}`}
                        />
                      </label>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{item.details}</p>
                    {item.provider && (
                      <p className="text-xs text-muted-foreground mb-2">{item.provider}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          1 hour
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          ₹{item.price}
                        </span>
                        <span className="flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          4.5
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Day Summary */}
            <div className="bg-muted/30 border border-border rounded-xl p-4 mt-6">
              <h3 className="font-semibold text-foreground mb-2 flex items-center">
                <BarChart3 className="w-4 h-4 text-primary mr-2" />
                Day Summary
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-foreground">{dayStats.activities}</div>
                  <div className="text-xs text-muted-foreground">Activities</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">₹{dayStats.cost}</div>
                  <div className="text-xs text-muted-foreground">Estimated Cost</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{dayStats.duration}</div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
