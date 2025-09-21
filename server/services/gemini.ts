import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateVibes(destination: string): Promise<string[]> {
  try {
    const prompt = `You are a travel expert. For the destination "${destination}", what are the top 6 most relevant travel themes or "vibes"?
    
    Use Google Search to find popular activities and attractions to determine these themes.
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
    const prompt = `
      Act as an expert travel agent. Today's date is ${currentDate}.
      Your primary task is to use the Google Search tool to find real-time, current pricing and availability for flights and hotels. The prices in your response MUST be based on the search results.

      Create a personalized travel itinerary based on the following details:
      - Departure City: ${from}
      - Destination City: ${to}
      - Start Date: ${startDate}
      - End Date: ${endDate}
      - Trip Vibe/Theme: ${theme}
      - Total Budget: Approximately ₹${budget} INR

      **Instructions:**
      1. **Search for Flights:** Perform a Google Search for one-way flights from "${from}" to "${to}" on "${startDate}". Extract a real airline, flight number, and its current price in INR.
      2. **Search for Hotels:** Perform a Google Search for hotels in "${to}" available from "${startDate}" to "${endDate}" that match the "${theme}" vibe. Find a real hotel and its price per night. Calculate the total price for the duration of the stay.
      3. **Search for Activities:** Perform a Google Search for activities in "${to}" that match the "${theme}" vibe. Find 2-3 relevant activities per day and their estimated costs in INR.
      4. **Construct the JSON response:** Use the information and prices gathered from your searches to build the itinerary. Ensure the sum of all prices is close to the user's total budget.

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
              { "type": "flight", "title": "Flight from ${from} to ${to}", "details": "Airline and flight number from search", "provider": "Airline Name from search", "price": 280 },
              { "type": "hotel", "title": "Hotel Name from search", "details": "Brief description of the hotel", "provider": "Booking Site found in search", "price": 960 },
              { "type": "activity", "title": "Activity Name from search", "details": "Description of the activity", "provider": "Tour Operator", "price": 50 }
            ]
          }
        ]
      }
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
