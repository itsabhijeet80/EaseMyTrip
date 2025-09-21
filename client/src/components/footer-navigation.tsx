import { Home, Route, ShoppingCart, User } from "lucide-react";
import { useLocation } from "wouter";
import { useTripStore } from "@/hooks/use-trip-store";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Home", testId: "nav-home" },
  { path: "/itinerary", icon: Route, label: "Itinerary", testId: "nav-itinerary" },
  { path: "/cart", icon: ShoppingCart, label: "Cart", testId: "nav-cart" },
  { path: "/profile", icon: User, label: "Profile", testId: "nav-profile" },
];

export default function FooterNavigation() {
  const [location, setLocation] = useLocation();
  const itemCount = useTripStore(state => state.getItemCount());

  return (
    <footer className="bg-card border-t border-border sticky bottom-0 z-20">
      <nav className="flex justify-around py-3">
        {navItems.map((item) => {
          const isActive = location === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={cn(
                "flex flex-col items-center space-y-1 transition-colors relative",
                isActive 
                  ? "text-primary nav-item active" 
                  : "text-muted-foreground hover:text-foreground nav-item"
              )}
              data-testid={item.testId}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
              
              {item.path === "/cart" && itemCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-secondary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </footer>
  );
}
