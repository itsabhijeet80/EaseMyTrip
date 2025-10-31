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

// Map vibes to unique images and descriptions
// Using local generic images that represent the vibe, not specific locations
const vibeImageMap: { [key: string]: string } = {
  'beach-1': '/images/vibes/beach-1.jpg',
  'beach-2': '/images/vibes/beach-2.jpg',
  'party-1': '/images/vibes/party-1.jpg',
  'party-2': '/images/vibes/party-2.jpg',
  'culture-1': '/images/vibes/culture-1.jpg',
  'culture-2': '/images/vibes/culture-2.jpg',
  'food-1': '/images/vibes/food-1.jpg',
  'food-2': '/images/vibes/food-2.jpg',
  'shop-1': '/images/vibes/shop-1.jpg',
  'shop-2': '/images/vibes/shop-2.jpg',
  'adventure-1': '/images/vibes/adventure-1.jpg',
  'adventure-2': '/images/vibes/adventure-2.jpg',
  'spiritual-1': '/images/vibes/spiritual-1.jpg',
  'spiritual-2': '/images/vibes/spiritual-2.jpg',
  'photo-1': '/images/vibes/photo-1.jpg',
  'photo-2': '/images/vibes/photo-2.jpg',
  'music-1': '/images/vibes/music-1.jpg',
  'music-2': '/images/vibes/music-2.jpg',
  'water-1': '/images/vibes/water-1.jpg',
  'water-2': '/images/vibes/water-2.jpg',
  'nature-1': '/images/vibes/nature-1.jpg',
  'nature-2': '/images/vibes/nature-2.jpg',
  'default-1': '/images/vibes/default-1.jpg',
  'default-2': '/images/vibes/default-2.jpg',
};

const usedImages = new Set<string>();

const getVibeDetails = (vibe: string) => {
  const vibeLower = vibe.toLowerCase();
  let category = 'default';
  let emoji = '✨';
  let description = 'Discover new';
  let bgColor = 'from-yellow-100 to-amber-100';
  
  if (vibeLower.includes('beach') || vibeLower.includes('relax') || vibeLower.includes('bliss')) {
    category = 'beach';
    emoji = '🏝️';
    description = 'Sun-soaked shores';
    bgColor = 'from-orange-100 to-yellow-100';
  } else if (vibeLower.includes('party') || vibeLower.includes('night') || vibeLower.includes('vibrant')) {
    category = 'party';
    emoji = '🍹';
    description = 'Electrifying evenings';
    bgColor = 'from-purple-100 to-pink-100';
  } else if (vibeLower.includes('culture') || vibeLower.includes('heritage') || vibeLower.includes('devotional') || vibeLower.includes('exploration')) {
    category = 'culture';
    emoji = '🛕';
    description = 'Rich traditions';
    bgColor = 'from-blue-100 to-cyan-100';
  } else if (vibeLower.includes('food') || vibeLower.includes('cuisine') || vibeLower.includes('dining') || vibeLower.includes('goan')) {
    category = 'food';
    emoji = '🍛';
    description = 'Culinary delights';
    bgColor = 'from-green-100 to-emerald-100';
  } else if (vibeLower.includes('shop')) {
    category = 'shop';
    emoji = '🛍️';
    description = 'Local markets';
    bgColor = 'from-pink-100 to-rose-100';
  } else if (vibeLower.includes('adventure') || vibeLower.includes('trek') || vibeLower.includes('hiking')) {
    category = 'adventure';
    emoji = '⛰️';
    description = 'Thrilling experiences';
    bgColor = 'from-slate-100 to-gray-100';
  } else if (vibeLower.includes('spirit') || vibeLower.includes('yoga') || vibeLower.includes('meditation')) {
    category = 'spiritual';
    emoji = '🧘';
    description = 'Inner peace';
    bgColor = 'from-indigo-100 to-purple-100';
  } else if (vibeLower.includes('photo') || vibeLower.includes('instagram')) {
    category = 'photo';
    emoji = '📸';
    description = 'Picture-perfect';
    bgColor = 'from-amber-100 to-orange-100';
  } else if (vibeLower.includes('music') || vibeLower.includes('festival')) {
    category = 'music';
    emoji = '🎵';
    description = 'Rhythms & celebrations';
    bgColor = 'from-red-100 to-pink-100';
  } else if (vibeLower.includes('water') || vibeLower.includes('rafting') || vibeLower.includes('river')) {
    category = 'water';
    emoji = '🚣';
    description = 'Aquatic adventures';
    bgColor = 'from-cyan-100 to-blue-100';
  } else if (vibeLower.includes('nature') || vibeLower.includes('wildlife')) {
    category = 'nature';
    emoji = '🌲';
    description = 'Natural beauty';
    bgColor = 'from-emerald-100 to-green-100';
  }
  
  // Get unique image for this vibe
  const image1 = `${category}-1`;
  const image2 = `${category}-2`;
  let imageKey = image1;
  
  if (usedImages.has(image1) && !usedImages.has(image2)) {
    imageKey = image2;
  } else if (!usedImages.has(image1)) {
    imageKey = image1;
  }
  
  usedImages.add(imageKey);
  
  return {
    emoji,
    image: vibeImageMap[imageKey] || vibeImageMap['default-1'],
    description,
    bgColor
  };
};

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
  
  // Reset used images on render to ensure uniqueness
  usedImages.clear();

  return (
    <main className="flex-grow overflow-y-auto custom-scrollbar p-6 fade-in">
      {/* Header */}
      <header className="text-center mb-6 relative">
        <div className="flex items-center justify-center gap-3 mb-2">
          {/* Paper Plane Icon with trail */}
          <div className="relative">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
              {/* Trail/swoosh */}
              <path d="M2 12C2 12 6 8 10 10" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
              {/* Paper plane */}
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 12L11 13" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#4A90E2" fillOpacity="0.2"/>
            </svg>
          </div>
          
          {/* Title with colorful dots */}
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Ease My Plan</h1>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-1">Your AI-powered travel companion</p>
        <p className="text-xs text-blue-500 font-medium">Powered by Gemini AI</p>
        
        {/* Gemini Wave Logo - Top Right */}
        <div className="absolute top-0 right-0">
          <svg className="w-12 h-12 opacity-30" viewBox="0 0 24 24" fill="none">
            <path d="M2 12C2 12 5 6 12 6C19 6 22 12 22 12C22 12 19 18 12 18C5 18 2 12 2 12Z" stroke="#4A90E2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" fill="#4A90E2"/>
          </svg>
        </div>
      </header>

      {/* Trip Form */}
      <div className="bg-card rounded-xl shadow-lg p-6 border border-border/50">
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location Selection */}
        <div className="relative">
          <div className="space-y-3">
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
          
          {/* Swap Button - Positioned absolutely in the center */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={swapLocations}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-accent shadow-md z-10 bg-card"
            data-testid="swap-locations"
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
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
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Heart className="w-5 h-5 text-secondary mr-2" />
            Select Your Vibe
          </h2>
          
          {vibesLoading ? (
            <div className="text-center text-muted-foreground py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2"></div>
              Fetching personalized vibes...
            </div>
          ) : (
            <div className="relative -mx-6 px-6">
              {/* Two rows with horizontal scroll */}
              <div className="flex flex-col gap-3 overflow-x-auto pb-3 pt-1 pl-1 pr-3 vibe-scrollbar">
                {/* Row 1 */}
                <div className="flex gap-3 flex-nowrap">
                  {vibes.map((vibe: string, index: number) => {
                    if (index % 2 !== 0) return null; // Only even indices (0, 2, 4...)
                    
                    const details = getVibeDetails(vibe);
                    const isSelected = selectedTheme === vibe;
                    
                    return (
                      <button
                        key={vibe}
                        type="button"
                        onClick={() => setSelectedTheme(vibe)}
                        className={cn(
                          "flex-shrink-0 w-[180px] rounded-xl transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden bg-gradient-to-br",
                          details.bgColor,
                          isSelected 
                            ? "ring-2 ring-primary shadow-lg" 
                            : "hover:ring-2 hover:ring-primary/30"
                        )}
                        data-testid={`theme-${vibe.toLowerCase().replaceAll(' ', '-')}`}
                      >
                        {/* Checkmark for selected */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center z-10 shadow-md">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Horizontal layout - Emoji on left, text on right */}
                        <div className="p-3 flex items-center gap-3">
                          {/* Colorful Emoji Icon */}
                          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-3xl">
                            {details.emoji}
                          </div>
                          
                          {/* Text content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-xs text-foreground mb-0.5 leading-tight line-clamp-1">
                              {vibe}
                            </h3>
                            <p className="text-[10px] text-muted-foreground leading-snug line-clamp-1">
                              {details.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Row 2 */}
                <div className="flex gap-3 flex-nowrap">
                  {vibes.map((vibe: string, index: number) => {
                    if (index % 2 === 0) return null; // Only odd indices (1, 3, 5...)
                    
                    const details = getVibeDetails(vibe);
                    const isSelected = selectedTheme === vibe;
                    
                    return (
                      <button
                        key={vibe}
                        type="button"
                        onClick={() => setSelectedTheme(vibe)}
                        className={cn(
                          "flex-shrink-0 w-[180px] rounded-xl transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden bg-gradient-to-br",
                          details.bgColor,
                          isSelected 
                            ? "ring-2 ring-primary shadow-lg" 
                            : "hover:ring-2 hover:ring-primary/30"
                        )}
                        data-testid={`theme-${vibe.toLowerCase().replaceAll(' ', '-')}`}
                      >
                        {/* Checkmark for selected */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center z-10 shadow-md">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Horizontal layout - Emoji on left, text on right */}
                        <div className="p-3 flex items-center gap-3">
                          {/* Colorful Emoji Icon */}
                          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center text-3xl">
                            {details.emoji}
                          </div>
                          
                          {/* Text content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-xs text-foreground mb-0.5 leading-tight line-clamp-1">
                              {vibe}
                            </h3>
                            <p className="text-[10px] text-muted-foreground leading-snug line-clamp-1">
                              {details.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Scroll hint indicator */}
              {vibes.length > 4 && (
                <div className="absolute top-1/2 right-0 -translate-y-1/2 pointer-events-none">
                  <div className="bg-gradient-to-l from-background via-background/80 to-transparent w-12 h-32 flex items-center justify-end pr-2">
                    <svg className="w-5 h-5 text-muted-foreground animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )}
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
