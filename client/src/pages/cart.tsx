import { useState } from "react";
import { ShoppingCart, CreditCard, Shield, RotateCcw, Phone, Gem, Trash2 } from "lucide-react";
import { useTripStore } from "@/hooks/use-trip-store";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function Cart() {
  const { cartItems, setCartItems, getTotalCost, currentTrip } = useTripStore();
  const queryClient = useQueryClient();
  const [upgradeAdded, setUpgradeAdded] = useState(false);

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => api.deleteCartItem(itemId),
    onSuccess: (_, itemId) => {
      setCartItems(cartItems.filter(item => item.id !== itemId));
      if (currentTrip) {
        queryClient.invalidateQueries({ queryKey: ["/api/trips", currentTrip.id, "cart"] });
      }
    },
  });

  const includedItems = cartItems.filter(item => item.included);
  const totalCost = getTotalCost();

  const priceBreakdown = {
    accommodation: includedItems.filter(item => item.type === 'hotel').reduce((sum, item) => sum + item.price, 0),
    flights: includedItems.filter(item => item.type === 'flight').reduce((sum, item) => sum + item.price, 0),
    activities: includedItems.filter(item => item.type === 'activity').reduce((sum, item) => sum + item.price, 0),
    discount: 80,
    taxes: 95,
  };

  const upgradePrice = 480;
  const finalTotal = totalCost - priceBreakdown.discount + priceBreakdown.taxes + (upgradeAdded ? upgradePrice : 0);

  return (
    <main className="flex-grow overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <header className="text-center mb-6">
        <ShoppingCart className="w-8 h-8 text-primary mx-auto mb-2" />
        <h1 className="text-2xl font-bold text-foreground">Your Trip Summary</h1>
        <p className="text-muted-foreground">Review your selected items</p>
      </header>

      {/* Cart Items */}
      <div className="space-y-3" data-testid="cart-items">
        {includedItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          includedItems.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.details}</p>
                  {item.provider && (
                    <div className="flex items-center mt-1 text-xs text-muted-foreground">
                      <span>{item.provider}</span>
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-foreground">₹{item.price}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItemMutation.mutate(item.id)}
                    disabled={removeItemMutation.isPending}
                    className="text-xs text-destructive hover:text-destructive/80 mt-1 p-0 h-auto"
                    data-testid={`remove-item-${item.id}`}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {includedItems.length > 0 && (
        <>
          {/* Price Breakdown */}
          <div className="mt-6 p-4 bg-muted/30 rounded-xl">
            <h3 className="font-semibold text-foreground mb-3">Price Breakdown</h3>
            <div className="space-y-2 text-sm">
              {priceBreakdown.accommodation > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accommodation</span>
                  <span className="text-foreground">₹{priceBreakdown.accommodation}</span>
                </div>
              )}
              {priceBreakdown.flights > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Flights</span>
                  <span className="text-foreground">₹{priceBreakdown.flights}</span>
                </div>
              )}
              {priceBreakdown.activities > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Activities</span>
                  <span className="text-foreground">₹{priceBreakdown.activities}</span>
                </div>
              )}
              <div className="flex justify-between text-green-600">
                <span>Early Bird Discount</span>
                <span>-₹{priceBreakdown.discount}</span>
              </div>
              {upgradeAdded && (
                <div className="flex justify-between" data-testid="upgrade-line-item">
                  <span className="text-muted-foreground">Premium Suite Upgrade</span>
                  <span className="text-foreground">+₹{upgradePrice}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes & Fees</span>
                <span className="text-foreground">₹{priceBreakdown.taxes}</span>
              </div>
              <div className="border-t border-border pt-2 mt-3">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-foreground">Total Trip Cost:</span>
                  <span className="text-primary" data-testid="total-cost">₹{finalTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Recommendations */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center">
              <Gem className="w-5 h-5 text-secondary mr-2" />
              Upgrade Your Experience
            </h2>
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <Gem className="w-5 h-5 text-secondary mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">Premium Ocean View Suite</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upgrade to our best room with private balcony and butler service for just $120 more per night.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">+$480 total</span>
                    <Button
                      className="bg-primary text-primary-foreground text-sm font-medium py-2 px-4 hover:bg-primary/90"
                      data-testid="add-upgrade-button"
                      onClick={() => setUpgradeAdded(!upgradeAdded)}
                    >
                      {upgradeAdded ? "Remove Upgrade" : "Add Upgrade"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <Button
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold py-4 px-6 shadow-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl mt-8"
            data-testid="checkout-button"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Proceed to Secure Checkout
          </Button>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Shield className="w-3 h-3 mr-1" />
              Secure Payment
            </div>
            <div className="flex items-center">
              <RotateCcw className="w-3 h-3 mr-1" />
              Free Cancellation
            </div>
            <div className="flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              24/7 Support
            </div>
          </div>
        </>
      )}
    </main>
  );
}
