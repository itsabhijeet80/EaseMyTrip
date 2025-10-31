import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateVibes(destination: string): Promise<string[]> {
  try {
    const prompt = `You are a travel expert. For the destination "${destination}", what are the top 6 most relevant travel themes or "vibes"?
    
    Based on your knowledge of popular activities and attractions, determine these themes.
    Return ONLY a valid JSON array of strings, like ["Vibe1", "Vibe2", "Vibe3", "Vibe4", "Vibe5", "Vibe6"]. 
    Do not include any other text, explanation, or markdown formatting. 
    
    For example, for Goa, a good response would be ["Beach & Chill", "Party & Nightlife", "Cultural Exploration", "Adventure Sports", "Food & Dining", "Nature & Wildlife"]. 
    For Rishikesh, it might be ["Spiritual & Yoga", "Adventure Sports", "Trekking & Hiking", "River Rafting", "Nature Retreat", "Meditation"].`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    let jsonString = response.text || "";
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    
    const vibes = JSON.parse(jsonString);
    return Array.isArray(vibes) ? vibes : [];
  } catch (error) {
    console.error("Error generating vibes:", error);
    // Fallback vibes
    return ['Adventure', 'Relaxation', 'Culture', 'Food & Dining', 'Nature', 'Photography'];
  }
}

export async function generateTripPlan(
  from: string,
  to: string,
  startDate: string,
  endDate: string,
  theme: string,
  budget: number
): Promise<any> {
  try {
    const currentDate = new Date().toLocaleDateString();
    const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    
    const prompt = `
      Act as an expert travel agent. Today's date is ${currentDate}.
      Create a personalized travel itinerary based on the following details:
      - Departure City: ${from}
      - Destination City: ${to}
      - Start Date: ${startDate}
      - End Date: ${endDate}
      - Duration: ${days} days
      - Trip Vibe/Theme: ${theme}
      - Total Budget: Approximately ₹${budget} INR

      **Instructions:**
      Create a realistic itinerary with estimated prices for flights, hotels, and activities that fit the theme and budget.
      Provide realistic prices based on typical costs for these services in India.
      Include 1-2 activities per day that match the "${theme}" theme.

      **Output Format:**
      Return ONLY a valid JSON object with the exact following structure. Do not include any text, explanation, or markdown formatting before or after the JSON.
      {
        "title": "A creative and fitting title for the trip",
        "days": [
          {
            "day_number": 1,
            "theme": "A theme for this specific day",
            "ai_summary": "A short, engaging summary of the plan for this day.",
            "recommendations": [
              { "type": "flight", "title": "Flight from ${from} to ${to}", "details": "Realistic airline and flight info", "provider": "IndiGo/Air India/SpiceJet", "price": 3500 },
              { "type": "hotel", "title": "Hotel name matching the theme", "details": "Brief description of the hotel", "provider": "MakeMyTrip/Booking.com", "price": 2500 },
              { "type": "activity", "title": "Activity name", "details": "Description of the activity", "provider": "Local tour operator", "price": 800 }
            ]
          }
        ]
      }
      
      Make sure the total of all prices stays within ₹${budget} INR.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    let jsonString = response.text || "";
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '').trim();

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error generating trip plan:", error);
    throw new Error("Failed to generate trip plan");
  }
}

export async function detectTripAction(message: string, tripContext?: any): Promise<any> {
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

export async function executeModification(action: string, params: any, tripContext: any): Promise<any> {
  try {
    const prompt = `You are an AI that generates modifications to trip itineraries.

Current trip: ${JSON.stringify(tripContext, null, 2)}

Action to execute: ${action}
Parameters: ${JSON.stringify(params, null, 2)}

Based on the action, generate a modified version of the trip. Return ONLY a valid JSON object with:
{
  "modifiedTrip": { ... complete modified trip object ... },
  "changes": ["List of what changed"],
  "suggestion": "Helpful suggestion after the change"
}

Important: Maintain the same structure as the original trip. Keep all existing fields.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    let jsonString = response.text || "";
    jsonString = jsonString.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error executing modification:", error);
    throw new Error("Failed to execute modification");
  }
}

export async function analyzeBudgetOptimization(tripContext: any): Promise<any> {
  try {
    const prompt = `You are a budget optimization expert. Analyze this trip and suggest optimizations:

Trip: ${JSON.stringify(tripContext, null, 2)}

Provide a comprehensive budget analysis with:
1. Current spending breakdown by category
2. Optimization suggestions (downgrade/upgrade swaps)
3. Alternative options at different price points (Budget, Standard, Luxury)
4. Savings opportunities
5. Value-for-money recommendations

Return ONLY a valid JSON object with:
{
  "currentBreakdown": {
    "hotels": number,
    "flights": number,
    "activities": number,
    "total": number
  },
  "optimizations": [
    {
      "type": "smart_swap",
      "title": "Swap suggestion title",
      "description": "Detailed explanation",
      "currentItem": "what to change",
      "suggestedItem": "what to change to",
      "savings": number,
      "impact": "minimal/moderate/significant"
    }
  ],
  "alternatives": {
    "budget": { "totalCost": number, "description": "what changes" },
    "standard": { "totalCost": number, "description": "current level" },
    "luxury": { "totalCost": number, "description": "upgraded version" }
  },
  "insights": [
    "Key insight 1",
    "Key insight 2",
    "Key insight 3"
  ],
  "hiddenGems": [
    {
      "title": "Hidden gem name",
      "description": "Why it's great value",
      "price": number,
      "category": "hotel/activity"
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

export async function generateSmartRecommendations(tripContext: any, dayNumber?: number): Promise<any> {
  try {
    const prompt = `You are an intelligent travel recommendation engine. Analyze this trip and provide personalized suggestions:

Trip Context: ${JSON.stringify(tripContext, null, 2)}
${dayNumber ? `Focus on Day ${dayNumber}` : 'Provide overall trip suggestions'}

Generate smart, context-aware recommendations considering:
1. The selected theme/vibe
2. Time of day and activity sequencing
3. Budget constraints
4. Weather and season (mock as appropriate)
5. Local events and hidden gems

Return ONLY a valid JSON object with:
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
      "description": "What was accomplished",
      "icon": "🏆" | "🎖️" | "⭐" | "🎯",
      "unlocked": boolean
    }
  ],
  "stats": {
    "favoriteDestinationType": "beach" | "mountains" | "city" | "countryside",
    "averageTripDuration": number,
    "budgetCategory": "budget" | "mid-range" | "luxury",
    "travelFrequency": "occasional" | "frequent" | "avid"
  }
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
