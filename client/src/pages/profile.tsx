import { User, Settings, Heart, DollarSign, Globe, HelpCircle, Headphones, Star, LogOut, Edit, Bell, CreditCard, Palette, TrendingUp, Award, Brain, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProfileSkeleton } from "@/components/loading-skeleton";

export default function Profile() {
  const userStats = {
    trips: 12,
    countries: 8,
    savings: 2400,
  };

  const { data: insights, isLoading } = useQuery({
    queryKey: ["/api/user/insights"],
    queryFn: () => api.getUserInsights(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

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

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <main className="flex-grow overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <header className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-4 border-4 border-border shadow-xl flex items-center justify-center">
          <User className="w-10 h-10 text-white" />
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

      {/* AI Travel Personality */}
      {insights?.travelPersonality && (
        <div className="mb-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 rounded-xl p-4">
          <div className="flex items-start">
            <Brain className="w-8 h-8 text-purple-600 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-foreground mb-1 flex items-center">
                Your Travel Personality: {insights.travelPersonality.type}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{insights.travelPersonality.description}</p>
              <div className="flex flex-wrap gap-2">
                {insights.travelPersonality.traits.map((trait: string, idx: number) => (
                  <span key={idx} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-shadow">
          <div className="text-2xl font-bold text-primary">{userStats.trips}</div>
          <div className="text-xs text-muted-foreground">Trips Planned</div>
        </div>
        <div className="text-center p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-shadow">
          <div className="text-2xl font-bold text-secondary">{userStats.countries}</div>
          <div className="text-xs text-muted-foreground">Countries Visited</div>
        </div>
        <div className="text-center p-4 bg-card border border-border rounded-xl hover:shadow-lg transition-shadow">
          <div className="text-2xl font-bold text-primary">₹{(userStats.savings / 1000).toFixed(1)}K</div>
          <div className="text-xs text-muted-foreground">Money Saved</div>
        </div>
      </div>

      {/* AI Insights */}
      {insights?.insights && insights.insights.length > 0 && (
        <div className="mb-6 bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center">
            <TrendingUp className="w-5 h-5 text-primary mr-2" />
            AI Insights
          </h3>
          <div className="space-y-3">
            {insights.insights.map((insight: any, idx: number) => (
              <div key={idx} className="bg-muted/30 rounded-lg p-3">
                <h4 className="font-medium text-sm text-foreground flex items-center">
                  <span className="text-lg mr-2">{insight.icon}</span>
                  {insight.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {insights?.achievements && insights.achievements.length > 0 && (
        <div className="mb-6 bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center">
            <Award className="w-5 h-5 text-primary mr-2" />
            Travel Achievements
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {insights.achievements.map((achievement: any, idx: number) => (
              <div 
                key={idx}
                className={`rounded-lg p-3 border ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200'
                    : 'bg-muted/30 border-muted opacity-60'
                }`}
              >
                <div className="text-2xl mb-1 text-center">{achievement.icon}</div>
                <h4 className="font-semibold text-xs text-foreground text-center mb-1">
                  {achievement.title}
                </h4>
                <p className="text-[10px] text-muted-foreground text-center">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {insights?.recommendations && insights.recommendations.length > 0 && (
        <div className="mb-6 bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center">
            <MapPin className="w-5 h-5 text-primary mr-2" />
            Recommended For You
          </h3>
          <div className="space-y-3">
            {insights.recommendations.slice(0, 3).map((rec: any, idx: number) => (
              <div key={idx} className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm text-foreground flex-1">{rec.destination}</h4>
                  <span className="text-xs font-bold text-primary ml-2">₹{rec.estimatedBudget}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{rec.reason}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-700">Best time: {rec.bestTime}</span>
                  <Button size="sm" variant="outline" className="h-6 text-xs border-blue-300">
                    Plan Trip
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
