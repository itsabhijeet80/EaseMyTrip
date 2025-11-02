import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Fixed vibes database for major cities (case-insensitive matching)
const FIXED_VIBES_DB: Record<string, string[]> = {
  // Indian Cities
  "goa": ["Beach & Chill", "Party & Nightlife", "Cultural Exploration", "Adventure Sports", "Food & Dining", "Nature & Wildlife"],
  "goa, india": ["Beach & Chill", "Party & Nightlife", "Cultural Exploration", "Adventure Sports", "Food & Dining", "Nature & Wildlife"],
  "bangalore": ["Tech & Innovation", "Garden City Exploration", "Nightlife & Entertainment", "Cultural Heritage", "Food & Cuisine", "Shopping & Markets"],
  "bangalore, india": ["Tech & Innovation", "Garden City Exploration", "Nightlife & Entertainment", "Cultural Heritage", "Food & Cuisine", "Shopping & Markets"],
  "bengaluru": ["Tech & Innovation", "Garden City Exploration", "Nightlife & Entertainment", "Cultural Heritage", "Food & Cuisine", "Shopping & Markets"],
  "delhi": ["Historical Monuments", "Street Food Tour", "Shopping & Markets", "Cultural Heritage", "Nightlife & Entertainment", "Spiritual Sites"],
  "new delhi": ["Historical Monuments", "Street Food Tour", "Shopping & Markets", "Cultural Heritage", "Nightlife & Entertainment", "Spiritual Sites"],
  "mumbai": ["Bollywood Experience", "Street Food & Cuisine", "Shopping & Markets", "Nightlife & Entertainment", "Historical Sites", "Coastal Views"],
  "pune": ["Historical Forts", "Cultural Heritage", "Food & Cuisine", "Educational Tours", "Adventure Sports", "Nightlife"],
  "hyderabad": ["Royal Heritage", "Food & Biryani", "Historical Monuments", "Shopping & Pearls", "Cultural Experiences", "Tech & Innovation"],
  "chennai": ["Beach & Temples", "Cultural Heritage", "Food & Cuisine", "Shopping & Markets", "Historical Sites", "Classical Arts"],
  "kolkata": ["Cultural Heritage", "Street Food & Cuisine", "Historical Sites", "Art & Literature", "Shopping & Markets", "River Cruises"],
  "jaipur": ["Royal Heritage", "Palaces & Forts", "Shopping & Handicrafts", "Cultural Experiences", "Food & Cuisine", "Photography"],
  "udaipur": ["Romantic Getaway", "Palaces & Lakes", "Cultural Heritage", "Food & Cuisine", "Boat Rides", "Shopping"],
  "varanasi": ["Spiritual Journey", "Ganges Experience", "Cultural Heritage", "Yoga & Meditation", "Food & Cuisine", "Photography"],
  "rishikesh": ["Adventure Sports", "Yoga & Meditation", "Spiritual Experience", "Nature & Wildlife", "River Activities", "Mountain Views"],
  "varkala": ["Beach & Chill", "Cliff Views", "Ayurveda & Wellness", "Food & Cuisine", "Photography", "Relaxation"],
  
  // International Cities
  "paris": ["Romantic Getaway", "Art & Culture", "Historic Sites", "Food & Wine", "Shopping", "Photography"],
  "london": ["Historic Sites", "Museums & Art", "Shopping", "Food & Pubs", "Theater & Entertainment", "Parks & Gardens"],
  "new york": ["City Exploration", "Entertainment & Shows", "Shopping", "Food & Dining", "Museums & Art", "Nightlife"],
  "tokyo": ["Modern & Traditional", "Food & Sushi", "Shopping", "Temples & Culture", "Technology", "Entertainment"],
  "dubai": ["Luxury Experience", "Modern Architecture", "Shopping", "Entertainment", "Desert Safari", "Food & Dining"],
  "singapore": ["Modern City", "Food & Culture", "Shopping", "Entertainment", "Gardens & Parks", "Family Friendly"],
  "bangkok": ["Temples & Culture", "Street Food", "Shopping", "Nightlife", "Massage & Wellness", "Markets"],
  "bali": ["Beach & Relaxation", "Temples & Culture", "Adventure Sports", "Food & Dining", "Yoga & Wellness", "Nature"],
};

// Helper function to get fixed vibes for a city
function getFixedVibes(destination: string): string[] | null {
  const destinationLower = destination.toLowerCase().trim();
  
  // Direct match
  if (FIXED_VIBES_DB[destinationLower]) {
    return FIXED_VIBES_DB[destinationLower];
  }
  
  // Partial match (e.g., "goa, india" contains "goa")
  for (const [key, vibes] of Object.entries(FIXED_VIBES_DB)) {
    if (destinationLower.includes(key) || key.includes(destinationLower)) {
      return vibes;
    }
  }
  
  return null;
}

export async function generateVibes(destination: string): Promise<string[]> {
  try {
    // First check fixed database
    const fixedVibes = getFixedVibes(destination);
    if (fixedVibes) {
      console.log(`Using fixed vibes for ${destination}`);
      return fixedVibes;
    }
    
    // If not in database and GEMINI_API_KEY is available, use AI
    if (process.env.GEMINI_API_KEY) {
      const prompt = `Generate 6 unique travel vibes/themes for ${destination}. Each vibe should be 2-4 words, catchy, and capture different travel experiences. Examples: "Beach & Chill", "Adventure Sports", "Cultural Heritage". Return only a JSON array of strings, no explanation.`;
      
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ parts: [{ text: prompt }] }],
        });
        
        let jsonString = response.text || "";
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '').trim();
        const vibes = JSON.parse(jsonString);
        
        if (Array.isArray(vibes) && vibes.length > 0) {
          return vibes.slice(0, 6);
        }
      } catch (error) {
        console.error("Error generating vibes with Gemini:", error);
      }
    }
    
    // Fallback to generic vibes
    console.log(`Using generic fallback vibes for ${destination}`);
    return ['Adventure', 'Relaxation', 'Culture', 'Food & Dining', 'Nature', 'Photography'];
  } catch (error) {
    console.error("Error in generateVibes:", error);
    return ['Adventure', 'Relaxation', 'Culture', 'Food & Dining', 'Nature', 'Photography'];
  }
}

// Helper function to generate fallback trip plan
function generateFallbackTripPlan(
  from: string,
  to: string,
  startDate: string,
  endDate: string,
  theme: string,
  budget: number,
  customRequest?: string,
  advancedOptions?: {
    selectAll?: boolean;
    includeFlights?: boolean;
    autoBook?: boolean;
    localRecommendations?: boolean;
  },
  travelers?: {
    adults: number;
    children: number;
  }
): any {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const tripPlan = {
    title: `${to.charAt(0).toUpperCase() + to.slice(1)} ${theme} Adventure`,
    ai_summary: `A ${days}-day ${theme.toLowerCase()} trip from ${from} to ${to}, carefully planned to stay within your budget of ₹${budget.toLocaleString('en-IN')}.`,
    days: [] as any[]
  };

  // Include flights based on advanced options
  const includeFlights = advancedOptions?.includeFlights !== false;
  
  for (let i = 1; i <= days; i++) {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + (i - 1));
    const dateStr = dayDate.toISOString().split('T')[0];
    
    const dayBudget = Math.floor(budget / days);
    const totalTravelers = travelers ? travelers.adults + travelers.children : 1;
    const recommendations = [];
    
    // Add flights on first and last day if includeFlights is true
    if (includeFlights) {
      if (i === 1) {
        const flightDetails = travelers 
          ? `Economy class flight for ${totalTravelers} ${totalTravelers === 1 ? 'traveler' : 'travelers'} with baggage allowance`
          : "Economy class flight with baggage allowance";
        recommendations.push({
          id: (i - 1) * 3 + 1,
          type: "flight",
          title: `Flight from ${from} to ${to}`,
          details: flightDetails + (customRequest ? `. ${customRequest.substring(0, 50)}` : ''),
          provider: "IndiGo",
          price: Math.floor(dayBudget * 0.4 * totalTravelers),
          included: true
        });
      } else if (i === days) {
        const flightDetails = travelers 
          ? `Economy class return flight for ${totalTravelers} ${totalTravelers === 1 ? 'traveler' : 'travelers'} with baggage allowance`
          : "Economy class return flight with baggage allowance";
        recommendations.push({
          id: (i - 1) * 3 + 1,
          type: "flight",
          title: `Flight from ${to} to ${from}`,
          details: flightDetails,
          provider: "IndiGo",
          price: Math.floor(dayBudget * 0.4 * totalTravelers),
          included: true
        });
      }
    }
    
    // Add hotel recommendation
    if (i === 1 || i === days) {
      const hotelDetails = travelers 
        ? `Accommodation for ${totalTravelers} ${totalTravelers === 1 ? 'traveler' : 'travelers'} matching ${theme.toLowerCase()} theme`
        : `Comfortable accommodation matching ${theme.toLowerCase()} theme`;
      recommendations.push({
        id: (i - 1) * 3 + 2,
        type: "hotel",
        title: `${theme} Hotel in ${to}`,
        details: hotelDetails + 
                 (advancedOptions?.autoBook ? ' - Easily bookable online' : '') +
                 (customRequest ? `. ${customRequest.substring(0, 50)}` : ''),
        provider: advancedOptions?.autoBook ? "MakeMyTrip" : "Local Provider",
        price: Math.floor(dayBudget * 0.35 * (travelers ? Math.ceil(totalTravelers / 2) : 1)), // Room pricing based on travelers
        included: true
      });
    }
    
    // Add activities
    const activityTypes = advancedOptions?.localRecommendations 
      ? [`Local hidden gem in ${to}`, `Authentic ${theme.toLowerCase()} experience`, `Off-the-beaten-path activity`]
      : [`${theme} Activity in ${to}`, `Popular ${theme.toLowerCase()} spot`, `${theme} Experience`];
    
    const activityType = activityTypes[(i - 1) % activityTypes.length];
    
    recommendations.push({
      id: (i - 1) * 3 + 3,
      type: "activity",
      title: activityType,
      details: `Exciting ${theme.toLowerCase()} experience` + 
               (advancedOptions?.localRecommendations ? ' recommended by locals' : '') +
               (customRequest ? `. ${customRequest.substring(0, 50)}` : ''),
      provider: advancedOptions?.localRecommendations ? "Local Guide" : "Tour Operator",
      price: Math.floor(dayBudget * 0.25),
      included: true
    });
    
    tripPlan.days.push({
      day_number: i,
      date: dateStr,
      summary: `Day ${i}: Exploring ${to} with ${theme.toLowerCase()} activities` + 
               (customRequest ? ` incorporating your preferences: ${customRequest.substring(0, 100)}` : ''),
      theme: `${theme} - Day ${i}`,
      ai_summary: `Day ${i} of your ${theme.toLowerCase()} adventure in ${to}` + 
                  (customRequest ? `. This day incorporates your specific requests.` : ''),
      recommendations: recommendations
    });
  }
  
  // Update summary if custom request is present
  if (customRequest) {
    tripPlan.ai_summary += ` Your specific requirements have been incorporated into the itinerary.`;
  }

  return tripPlan;
}

export async function generateTripPlan(
  from: string,
  to: string,
  startDate: string,
  endDate: string,
  theme: string,
  budget: number,
  customRequest?: string,
  advancedOptions?: {
    selectAll?: boolean;
    includeFlights?: boolean;
    autoBook?: boolean;
    localRecommendations?: boolean;
  },
  travelers?: {
    adults: number;
    children: number;
  }
): Promise<any> {
  
  // Check if Gemini API key is available
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
    console.warn('GEMINI_API_KEY is not set. Using fallback trip plan.');
    return generateFallbackTripPlan(from, to, startDate, endDate, theme, budget, customRequest, advancedOptions, travelers);
  }
  
  try {
    // Build custom request section (simplified - always include if provided)
    const customRequestSection = customRequest && customRequest.trim().length > 0
      ? `\n\nCUSTOM REQUIREMENTS: "${customRequest.trim()}" - Incorporate these preferences into the itinerary.`
      : '';
    
    // Build advanced options instructions (concise)
    const options = [];
    if (advancedOptions?.includeFlights === false) {
      options.push('No flights');
    } else if (advancedOptions?.includeFlights === true) {
      options.push('Include flights with airlines/timings');
    }
    if (advancedOptions?.autoBook === true) {
      options.push('Bookable online');
    }
    if (advancedOptions?.localRecommendations === true) {
      options.push('Local experiences');
    }
    const advancedOptionsSection = options.length > 0 ? `\n\nOPTIONS: ${options.join(', ')}` : '';

    // Build travelers section
    const travelersSection = travelers 
      ? `\n\nTRAVELERS: ${travelers.adults} ${travelers.adults === 1 ? 'adult' : 'adults'}${travelers.children > 0 ? `, ${travelers.children} ${travelers.children === 1 ? 'child' : 'children'}` : ''}. Adjust pricing and accommodation size accordingly (e.g., hotel rooms, flight seats, activity capacity).`
      : '';

    // Optimized, concise prompt
    const prompt = `Create a ${to} trip from ${from}, ${startDate} to ${endDate}. Theme: ${theme}. Budget: ₹${budget}.${travelersSection}${customRequestSection}${advancedOptionsSection}

Return ONLY valid JSON:
{
  "title": "Trip title (60 chars max)",
  "ai_summary": "2-3 sentence overview${customRequest ? ' incorporating custom requirements' : ''}",
  "days": [
    {
      "day_number": 1,
      "date": "${startDate}",
      "summary": "Day overview",
      "recommendations": [
        { "type": "flight", "title": "Flight from ${from} to ${to}", "details": "Airline and timing", "provider": "IndiGo/Air India/SpiceJet", "price": 3500, "included": true },
        { "type": "hotel", "title": "Hotel name", "details": "Description", "provider": "MakeMyTrip/Booking.com", "price": 2500, "included": true },
        { "type": "activity", "title": "Activity name", "details": "Description", "provider": "Local operator", "price": 800, "included": true }
      ]
    }
  ]
}

Rules:
- 3-6 recommendations per day (flights only on Day 1 and last day)
- Hotels each day with realistic pricing
- Activities match theme: ${theme}
- Total price within ₹${budget}
- All recommendations: type, title, details, provider, price, included=true`;

    console.log('Generated prompt length:', prompt.length);
    if (customRequest) {
      console.log('Custom request included in prompt:', customRequest.substring(0, 100));
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    let jsonString = response.text || "";
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '').trim();

    const parsedPlan = JSON.parse(jsonString);
    
    // Validate the response structure
    if (!parsedPlan.title || !parsedPlan.days || !Array.isArray(parsedPlan.days)) {
      console.warn('Invalid response structure from Gemini, using fallback');
      return generateFallbackTripPlan(from, to, startDate, endDate, theme, budget, customRequest, advancedOptions, travelers);
    }
    
    return parsedPlan;
  } catch (error) {
    console.error("Error generating trip plan with Gemini:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    console.log("Falling back to default trip plan");
    // Return fallback plan instead of throwing error
    return generateFallbackTripPlan(from, to, startDate, endDate, theme, budget, customRequest, advancedOptions, travelers);
  }
}

export async function detectTripAction(message: string, tripContext?: any): Promise<any> {
  // First, validate if the message is travel-related
  const validationPrompt = `You are a travel query validator. Determine if the following user message is related to travel planning, trip modification, destination information, itinerary planning, or travel assistance.

User message: "${message}"

Respond with ONLY "YES" if the message is travel-related (e.g., questions about destinations, trip planning, itinerary changes, travel recommendations, booking modifications, travel dates, accommodations, activities, restaurants, transportation, travel budgets, travel tips, or any trip-related inquiries). 

Respond with "NO" if it's completely unrelated to travel (e.g., asking about weather forecasts, currency conversion rates, general knowledge questions, or non-travel topics like coding, mathematics, etc.).

Response:`;

  try {
    const validationResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: validationPrompt }] }],
    });
    
    const validationResult = validationResponse.text?.trim().toUpperCase() || 'YES';
    const isValidTravelQuery = validationResult === 'YES';
    
    if (!isValidTravelQuery) {
      console.log('Action detection rejected - not travel-related:', message);
      // Return early with a non-action response that will be sent as a chat message
      return {
        hasAction: false,
        needsConfirmation: false,
        action: null,
        params: {},
        reasoning: "Query is not travel-related",
        confirmationMessage: "",
        response: "I'm a Travel Assistant, and I can only help you with travel-related planning and information. Please ask me about trip planning, destinations, itineraries, or any travel-related questions!"
      };
    }
  } catch (error) {
    console.error('Error validating action message, proceeding anyway:', error);
    // If validation fails, proceed with the request
  }

  try {
    const prompt = `You are an AI assistant that detects user intent for trip modifications.
    
User message: "${message}"

${tripContext ? `Current trip context: ${JSON.stringify(tripContext, null, 2)}` : ''}

Analyze if the user wants to modify their trip. Detect actions like:
- modify_budget: Change the total budget
- add_activity: Add a new activity to a day
- remove_activity: Remove an activity
- change_hotel: Change hotel recommendation
- add_day: Add another day to the trip
- remove_day: Remove a day from the trip
- change_theme: Change the trip theme/vibe
- optimize_budget: Ask for budget optimization suggestions

Return ONLY a valid JSON object with this structure:
{
  "hasAction": true/false,
  "action": "action_type" or null,
  "params": { ... parameters needed for the action ... },
  "reasoning": "Brief explanation of what user wants",
  "needsConfirmation": true/false,
  "confirmationMessage": "Message to show user before applying"
}

Examples:
User: "Make it cheaper" -> {"hasAction": true, "action": "modify_budget", "params": {"budgetChange": -500}, "reasoning": "User wants to reduce budget", "needsConfirmation": true, "confirmationMessage": "Reduce budget by ₹500?"}
User: "Add a spa day" -> {"hasAction": true, "action": "add_activity", "params": {"dayNumber": 1, "activityType": "spa"}, "reasoning": "User wants spa activity", "needsConfirmation": true, "confirmationMessage": "Add a spa activity to Day 1?"}
User: "What's the weather?" -> {"hasAction": false, "action": null, "params": {}, "reasoning": "User asking for information only", "needsConfirmation": false, "confirmationMessage": ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    let jsonString = response.text || "";
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error detecting action:", error);
    return { hasAction: false, action: null, params: {}, reasoning: "", needsConfirmation: false, confirmationMessage: "" };
  }
}

export async function detectItineraryPlanningIntent(message: string, conversationHistory?: string[]): Promise<any> {
  try {
    const historyContext = conversationHistory && conversationHistory.length > 0 
      ? `\n\nPrevious conversation:\n${conversationHistory.slice(-5).join('\n')}`
      : '';
    
    const prompt = `You are an AI assistant that detects if a user wants to plan a new trip itinerary. Analyze the user's message and conversation history.

User message: "${message}"${historyContext}

Determine:
1. Does the user want to plan a NEW trip itinerary? (e.g., "I want to plan a trip", "Help me create an itinerary", "Plan a vacation", "I need a trip plan")
2. If yes, extract any trip details mentioned:
   - Origin (from city/location)
   - Destination (to city/location)
   - Start date (travel start date)
   - End date (travel end date)
   - Vibe/Theme (travel style/preference - match with common vibes like "Beach & Chill", "Adventure Sports", "Cultural Heritage", "Food & Dining", "Party & Nightlife", etc.)
   - Budget (budget range or amount in INR)
   - Custom requirements (any specific requests or preferences)

Return ONLY a valid JSON object:
{
  "wantsToPlan": true/false,
  "extractedDetails": {
    "from": "origin city" or null,
    "to": "destination city" or null,
    "startDate": "YYYY-MM-DD" or null,
    "endDate": "YYYY-MM-DD" or null,
    "vibe": "vibe name matching UI vibes" or null,
    "budget": number (in INR) or null,
    "customRequest": "custom requirements text" or null
  },
  "missingFields": ["from", "to", "startDate", "endDate", "vibe", "budget"],
  "message": "Response message to user asking for missing information or confirming details"
}

If user doesn't want to plan, return:
{
  "wantsToPlan": false,
  "extractedDetails": {},
  "missingFields": [],
  "message": ""
}

Examples:
User: "I want to plan a trip to Goa from Bangalore" -> wantsToPlan: true, extractedDetails: {from: "bangalore", to: "goa", ...}, missingFields: ["startDate", "endDate", "vibe", "budget"]
User: "Plan a 3-day trip to Mumbai with beach vibe, budget 50000" -> wantsToPlan: true, extractedDetails: {from: null, to: "mumbai", startDate: calculated, endDate: calculated, vibe: "Beach & Chill", budget: 50000}, missingFields: ["from"]}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    let jsonString = response.text || "";
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error detecting itinerary planning intent:", error);
    return { 
      wantsToPlan: false, 
      extractedDetails: {}, 
      missingFields: [], 
      message: "" 
    };
  }
}

export async function extractTripDetailsFromMessage(message: string, existingDetails?: any, availableVibes?: string[]): Promise<any> {
  try {
    const existingContext = existingDetails 
      ? `\n\nExisting details collected so far:\n${JSON.stringify(existingDetails, null, 2)}`
      : '';
    
    const vibesContext = availableVibes && availableVibes.length > 0
      ? `\n\nAvailable vibes to match against: ${availableVibes.join(', ')}`
      : '';
    
    const prompt = `Extract trip planning details from the user's message. Focus only on new information mentioned in this message.

User message: "${message}"${existingContext}${vibesContext}

Extract or update:
- from: Origin city/location
- to: Destination city/location  
- startDate: Start date in YYYY-MM-DD format (if relative like "next week", calculate actual date)
- endDate: End date in YYYY-MM-DD format
- vibe: Match to one of the available vibes if provided, or suggest a vibe name
- budget: Budget amount in INR
- customRequest: Any additional custom requirements

Return ONLY a valid JSON object:
{
  "from": "city name" or null,
  "to": "city name" or null,
  "startDate": "YYYY-MM-DD" or null,
  "endDate": "YYYY-MM-DD" or null,
  "vibe": "vibe name" or null,
  "budget": number or null,
  "customRequest": "text" or null,
  "updated": true/false
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    let jsonString = response.text || "";
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error extracting trip details:", error);
    return { from: null, to: null, startDate: null, endDate: null, vibe: null, budget: null, customRequest: null, updated: false };
  }
}

export async function executeModification(action: string, params: any, tripContext: any): Promise<any> {
  try {
    const prompt = `You are an AI travel agent modifying an existing trip.

Action: ${action}
Parameters: ${JSON.stringify(params)}
Current Trip: ${JSON.stringify(tripContext, null, 2)}

Modify the trip according to the action and return the updated trip in the same JSON structure as the original trip.
Make sure to:
- Keep the same structure
- Update only what's necessary
- Recalculate prices if budget changed
- Maintain realistic recommendations

Return ONLY the modified trip JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    let jsonString = response.text || "";
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    
    const modifiedTrip = JSON.parse(jsonString);
    
    return {
      trip: modifiedTrip,
      changes: [`${action} applied`],
      suggestion: "Trip updated successfully!"
    };
  } catch (error) {
    console.error("Error executing modification:", error);
    throw new Error("Failed to modify trip");
  }
}

export async function analyzeBudgetOptimization(tripContext: any): Promise<any> {
  try {
    const prompt = `Analyze this trip's budget and provide optimization suggestions:

${JSON.stringify(tripContext, null, 2)}

Return a JSON object with:
{
  "currentBudget": number,
  "totalCost": number,
  "savings": number,
  "suggestions": [
    {
      "category": "hotels" | "activities" | "transport",
      "suggestion": "How to save money",
      "potentialSavings": number
    }
  ],
  "alternativeOptions": [
    {
      "type": "hotel" | "activity",
      "current": "Current option",
      "alternative": "Cheaper alternative",
      "savings": number
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    let jsonString = response.text || "";
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error analyzing budget:", error);
    throw new Error("Failed to analyze budget");
  }
}

export async function generateSmartRecommendations(tripId: string, dayNumber: number, tripContext: any): Promise<any> {
  try {
    const prompt = `Generate smart recommendations for a trip day:

Trip Context: ${JSON.stringify(tripContext, null, 2)}
Day Number: ${dayNumber}

Based on the trip theme, current activities, and typical traveler preferences, suggest:
- Additional activities that complement existing ones
- Restaurant recommendations
- Best times to visit places
- Local tips and insights

Return ONLY a valid JSON object with this structure:
{
  "recommendations": [
    {
      "type": "activity" | "restaurant" | "hotel" | "experience",
      "title": "Recommendation name",
      "description": "Why this fits the trip",
      "price": number,
      "timing": "morning/afternoon/evening/night",
      "reasoning": "AI explanation of why this is suggested",
      "popularity": "Most travelers add this after similar activities",
      "dayNumber": number (if applicable)
    }
  ],
  "sequences": [
    {
      "title": "Perfect day sequence",
      "activities": ["Activity 1", "Activity 2", "Activity 3"],
      "reasoning": "Why this sequence works well"
    }
  ],
  "localInsights": [
    {
      "type": "weather" | "event" | "tip",
      "title": "Insight title",
      "description": "Detailed insight",
      "relevance": "Why this matters for the trip"
    }
  ],
  "peopleAlsoAdded": [
    {
      "title": "Activity name",
      "percentage": number (0-100),
      "reason": "Why 75% of similar travelers add this"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    let jsonString = response.text || "";
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw new Error("Failed to generate recommendations");
  }
}

export async function generateUserInsights(userProfile: any): Promise<any> {
  try {
    const prompt = `You are an AI travel personality analyzer. Based on this user's travel history and preferences, generate personalized insights:

User Profile: ${JSON.stringify(userProfile, null, 2)}

Analyze and return ONLY a valid JSON object with:
{
  "travelPersonality": {
    "type": "Adventure Seeker" | "Luxury Explorer" | "Budget Traveler" | "Cultural Enthusiast" | "Beach Lover",
    "description": "Detailed personality description",
    "traits": ["trait1", "trait2", "trait3"]
  },
  "insights": [
    {
      "title": "Insight title",
      "description": "Detailed insight",
      "icon": "🎯" | "💡" | "🌟" | "📊"
    }
  ],
  "recommendations": [
    {
      "destination": "Recommended destination",
      "reason": "Why this matches the user's profile",
      "bestTime": "Season/month to visit",
      "estimatedBudget": number
    }
  ],
  "achievements": [
    {
      "title": "Achievement name",
      "description": "What user accomplished",
      "icon": "🏆" | "🌟" | "🎯"
    }
  ],
  "nextSteps": [
    {
      "suggestion": "Personalized suggestion",
      "reason": "Why this fits the user"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    let jsonString = response.text || "";
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error generating user insights:", error);
    throw new Error("Failed to generate user insights");
  }
}

export async function chatWithAI(message: string, tripContext?: any): Promise<string> {
  try {
    // First, validate if the message is travel-related
    const validationPrompt = `You are a travel query validator. Determine if the following user message is related to travel planning, trip modification, destination information, itinerary planning, or travel assistance.

User message: "${message}"

Respond with ONLY "YES" if the message is travel-related (e.g., questions about destinations, trip planning, itinerary changes, travel recommendations, booking modifications, travel dates, accommodations, activities, restaurants, transportation, travel budgets, travel tips, or any trip-related inquiries). 

Respond with "NO" if it's completely unrelated to travel (e.g., asking about weather forecasts, currency conversion rates, general knowledge questions, or non-travel topics like coding, mathematics, etc.).

Response:`;

    let isValidTravelQuery = true;
    try {
      const validationResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ parts: [{ text: validationPrompt }] }],
      });
      
      const validationResult = validationResponse.text?.trim().toUpperCase() || 'YES';
      isValidTravelQuery = validationResult === 'YES';
      
      if (!isValidTravelQuery) {
        console.log('Chat message rejected - not travel-related:', message);
        return "I'm a Travel Assistant, and I can only help you with travel-related planning and information. Please ask me about trip planning, destinations, itineraries, or any travel-related questions!";
      }
    } catch (error) {
      console.error('Error validating chat message, proceeding anyway:', error);
      // If validation fails, proceed with the request
      isValidTravelQuery = true;
    }

    // If validated as travel-related, proceed with normal chat
    let prompt = `You are a helpful AI travel assistant. The user is asking: "${message}"`;
    
    if (tripContext) {
      prompt += `\n\nContext: The user has a trip planned: ${JSON.stringify(tripContext)}`;
    }
    
    prompt += `\n\nProvide a helpful, concise response. If the user is asking to modify their trip, provide specific suggestions.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Error in chat:", error);
    return "I'm sorry, I'm having trouble right now. Please try again.";
  }
}
