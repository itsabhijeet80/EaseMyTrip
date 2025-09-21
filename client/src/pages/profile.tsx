import { User, Settings, Heart, DollarSign, Globe, HelpCircle, Headphones, Star, LogOut, Edit, Bell, CreditCard, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const userStats = {
    trips: 12,
    countries: 8,
    savings: 2400,
  };

  const profileSections = [
    {
      title: "Account Settings",
      icon: Settings,
      items: [
        { icon: Edit, label: "Edit Profile", testId: "edit-profile" },
        { icon: Bell, label: "Notifications", testId: "notifications" },
        { icon: CreditCard, label: "Payment Methods", testId: "payment-methods" },
      ]
    },
    {
      title: "Travel Preferences", 
      icon: Heart,
      items: [
        { icon: Palette, label: "Favorite Themes", testId: "favorite-themes" },
        { icon: DollarSign, label: "Budget Preferences", testId: "budget-preferences" },
        { icon: Globe, label: "Favorite Destinations", testId: "favorite-destinations" },
      ]
    },
    {
      title: "Support & Help",
      icon: HelpCircle,
      items: [
        { icon: HelpCircle, label: "Help Center", testId: "help-center" },
        { icon: Headphones, label: "Contact Support", testId: "contact-support" },
        { icon: Star, label: "Rate Our App", testId: "rate-app" },
      ]
    }
  ];

  return (
    <main className="flex-grow overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <header className="text-center mb-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 border-4 border-border shadow-lg flex items-center justify-center">
          <User className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">John Traveler</h1>
        <p className="text-muted-foreground">john.traveler@email.com</p>
        <div className="flex items-center justify-center mt-2 space-x-4 text-sm">
          <span className="flex items-center text-muted-foreground">
            <Globe className="w-3 h-3 mr-1" />
            Bangalore, India
          </span>
          <span className="flex items-center text-muted-foreground">
            <User className="w-3 h-3 mr-1" />
            Member since 2023
          </span>
        </div>
      </header>

      {/* Profile Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 bg-card border border-border rounded-xl">
          <div className="text-2xl font-bold text-primary">{userStats.trips}</div>
          <div className="text-xs text-muted-foreground">Trips Planned</div>
        </div>
        <div className="text-center p-4 bg-card border border-border rounded-xl">
          <div className="text-2xl font-bold text-secondary">{userStats.countries}</div>
          <div className="text-xs text-muted-foreground">Countries Visited</div>
        </div>
        <div className="text-center p-4 bg-card border border-border rounded-xl">
          <div className="text-2xl font-bold text-primary">₹{(userStats.savings / 1000).toFixed(1)}K</div>
          <div className="text-xs text-muted-foreground">Money Saved</div>
        </div>
      </div>

      {/* Profile Options */}
      <div className="space-y-4">
        {profileSections.map((section) => (
          <div key={section.title} className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center">
              <section.icon className="w-5 h-5 text-primary mr-2" />
              {section.title}
            </h3>
            <div className="space-y-3">
              {section.items.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
                  data-testid={item.testId}
                >
                  <div className="flex items-center">
                    <item.icon className="w-4 h-4 text-muted-foreground mr-3" />
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  <span className="text-muted-foreground">›</span>
                </Button>
              ))}
            </div>
          </div>
        ))}

        {/* Sign Out Button */}
        <Button
          variant="destructive"
          className="w-full py-3 px-4 font-medium"
          data-testid="sign-out-button"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </main>
  );
}
