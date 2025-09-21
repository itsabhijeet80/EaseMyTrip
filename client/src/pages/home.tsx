import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MapPin, Calendar, Heart, Wallet, Sparkles, ArrowUpDown } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTripStore } from "@/hooks/use-trip-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const locations = [
  { value: "bangalore", label: "Bangalore, India" },
  { value: "goa", label: "Goa, India" },
  { value: "rishikesh", label: "Rishikesh, India" },
  { value: "udaipur", label: "Udaipur, India" },
  { value: "varanasi", label: "Varanasi, India" },
  { value: "varkala", label: "Varkala, India" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { setCurrentTrip, setCartItems, setIsLoading } = useTripStore();
  
  const [formData, setFormData] = useState({
    from: "bangalore",
    to: "goa",
    startDate: "",
    endDate: "",
    theme: "",
    budget: [135000],
  });
  
  const [selectedTheme, setSelectedTheme] = useState("");

  // Initialize dates
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    
    setFormData(prev => ({
      ...prev,
      startDate: today,
      endDate: tomorrow.toISOString().split('T')[0],
    }));
  }, []);

  // Fetch vibes when destination changes
  const { data: vibesData, isLoading: vibesLoading } = useQuery({
    queryKey: ["/api/vibes", formData.to],
    queryFn: () => api.generateVibes(formData.to),
    enabled: !!formData.to,
  });

  const generateTripMutation = useMutation({
    mutationFn: api.generateTrip,
    onMutate: () => setIsLoading(true),
    onSuccess: (data) => {
      setCurrentTrip(data.trip);
      setCartItems([]); // Will be loaded separately
      setLocation("/itinerary");
    },
    onError: (error) => {
      console.error("Error generating trip:", error);
    },
    onSettled: () => setIsLoading(false),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tripRequest = {
      from: formData.from,
      to: formData.to,
      startDate: formData.startDate,
      endDate: formData.endDate,
      theme: selectedTheme || vibesData?.vibes[0] || "Adventure",
      budget: formData.budget[0],
    };

    generateTripMutation.mutate(tripRequest);
  };

  const swapLocations = () => {
    setFormData(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from,
    }));
  };

  const vibes = vibesData?.vibes || [];

  return (
    <main className="flex-grow overflow-y-auto custom-scrollbar p-6 fade-in">
      {/* Header */}
      <header className="text-center mb-8">
        <div className="floating-animation mb-4">
          <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Ease My Plan</h1>
        <p className="text-muted-foreground">Your AI-powered travel companion</p>
        <div className="flex justify-center items-center mt-2 space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          <span className="text-xs text-muted-foreground">Powered by Gemini AI</span>
        </div>
      </header>

      {/* Trip Form */}
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location Selection */}
        <div className="grid grid-cols-1 gap-4">
          <div className="relative">
            <Label htmlFor="from" className="flex items-center text-sm font-medium text-foreground mb-2">
              <MapPin className="w-4 h-4 text-primary mr-2" />
              From
            </Label>
            <Select value={formData.from} onValueChange={(value) => setFormData(prev => ({...prev, from: value}))}>
              <SelectTrigger data-testid="select-from">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.value} value={location.value}>
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={swapLocations}
              className="p-2 rounded-full hover:bg-accent"
              data-testid="swap-locations"
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Label htmlFor="to" className="flex items-center text-sm font-medium text-foreground mb-2">
              <MapPin className="w-4 h-4 text-secondary mr-2" />
              To
            </Label>
            <Select value={formData.to} onValueChange={(value) => setFormData(prev => ({...prev, to: value}))}>
              <SelectTrigger data-testid="select-to">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.value} value={location.value}>
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date" className="flex items-center text-sm font-medium text-foreground mb-2">
              <Calendar className="w-4 h-4 text-primary mr-2" />
              Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({...prev, startDate: e.target.value}))}
              data-testid="input-start-date"
            />
          </div>
          <div>
            <Label htmlFor="end-date" className="flex items-center text-sm font-medium text-foreground mb-2">
              <Calendar className="w-4 h-4 text-secondary mr-2" />
              End Date
            </Label>
            <Input
              id="end-date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({...prev, endDate: e.target.value}))}
              data-testid="input-end-date"
            />
          </div>
        </div>

        {/* Vibe Selection */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Heart className="w-5 h-5 text-secondary mr-2" />
            Select Your Vibe
          </h2>
          
          {vibesLoading ? (
            <div className="text-center text-muted-foreground py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto mb-2"></div>
              Fetching personalized vibes...
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {vibes.map((vibe: string) => (
                <Button
                  key={vibe}
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedTheme(vibe)}
                  className={cn(
                    "theme-pill transition-all",
                    selectedTheme === vibe && "active"
                  )}
                  data-testid={`theme-${vibe.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {vibe}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Budget Selection */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center">
              <Wallet className="w-5 h-5 text-secondary mr-2" />
              What's Your Budget?
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">₹{formData.budget[0]}</span>
            </div>
          </div>
          <Slider
            value={formData.budget}
            onValueChange={(value) => setFormData(prev => ({...prev, budget: value}))}
            max={250000}
            min={25000}
            step={5000}
            className="w-full"
            data-testid="budget-slider"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span className="flex items-center">
              <Wallet className="w-3 h-3 mr-1" />
              Budget Friendly (₹25,000)
            </span>
            <span className="flex items-center">
              Luxury <Sparkles className="w-3 h-3 ml-1" />
              (₹2,50,000)
            </span>
          </div>
        </div>

        {/* Create Plan Button */}
        <Button
          type="submit"
          disabled={generateTripMutation.isPending}
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold py-4 px-6 shadow-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl mt-8"
          data-testid="create-plan-button"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Create My Perfect Plan!
        </Button>

        {/* Advanced Options */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
          <h3 className="font-medium text-foreground mb-2 flex items-center">
            <Sparkles className="w-4 h-4 text-muted-foreground mr-2" />
            Advanced Options
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="include-flights" data-testid="checkbox-flights" />
              <Label htmlFor="include-flights" className="text-sm text-foreground">
                Include flights in planning
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="auto-book" data-testid="checkbox-auto-book" />
              <Label htmlFor="auto-book" className="text-sm text-foreground">
                Book accommodations automatically
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="local-recommendations" data-testid="checkbox-local" />
              <Label htmlFor="local-recommendations" className="text-sm text-foreground">
                Get local recommendations
              </Label>
            </div>
          </div>
        </div>
      </form>
      </div>
    </main>
  );
}
