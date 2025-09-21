# Ease My Plan - Travel Planner Web App Prototype
**Ease My Plan** is a responsive, mobile-first prototype of a travel planner web application. The application allows users to plan a trip by providing their destinations and dates, selecting a theme and budget, and then receiving a detailed, day-by-day itinerary. The app includes features for upselling and a conversational AI chatbot for making adjustments.
This prototype is designed as a front-end-only application, with all data (flights, hotels, activities, prices) being mocked.
## Core Features
  * **Intuitive Trip Planning:** Easily input departure/arrival cities and travel dates.
  * **Personalized Itineraries:** Select from various themes (e.g., "Beach & Chill", "Adventure") and set a budget to receive a custom day-by-day plan.
  * **Detailed Itinerary View:** View daily plans with recommendations for flights, hotels, and activities presented in clear, interactive cards.
  * **Upsell & Add-ons:** Discover opportunities to enhance your trip with upgrades and extra services.
  * **AI-Powered Adjustments:** Use a conversational AI chatbot to make real-time changes to your plan, like adjusting your budget.
  * **Trip Summary:** A comprehensive cart page that breaks down the total trip cost and offers last-minute recommendations.
## Brand Aesthetic & Tone
  * **Look and Feel:** Clean, modern, and professional, inspired by top-tier travel booking websites.
  * **Color Palette:**
      * **Primary:** Bright Blue (`#007BFF`) for active states, icons, and links.
      * **Call-to-Action:** Prominent Orange (`#FFA500`) for main buttons.
      * **Background:** Clean White (`#FFFFFF`) or Light Gray (`#F8F9FA`).
  * **UI Elements:** Cards and buttons feature rounded corners and subtle drop shadows for depth. The UI is spacious and optimized for mobile tap targets.
  * **Typography:** "Inter" font with a clear visual hierarchy (larger, bold text for headings).
  * **Tone:** Friendly, helpful, and inspiring, making trip planning feel exciting and effortless.
## Screen-by-Screen Breakdown
### Screen 1: The Initial Planner (Home Screen)
  * **Header:**
      * App Title: "Ease My Plan"
  * **Main Content:**
      * A form with fields for `From`, `To`, `Start Date`, and `End Date`.
  * **Footer Navigation:**
      * Four icons for Home, Trips, Cart, and Profile. The "Home" icon is in an active state.
### Screen 2: Filters - Themes & Budget
This screen appears as a continuation of the first screen.
  * **Themes Section:**
      * Heading: "Select Your Vibe"
      * A horizontally scrollable list of theme buttons (pills) like "Beach & Chill", "Party", "Adventure", etc. Selected themes are visually highlighted.
  * **Budget Section:**
      * Heading: "What's Your Budget?"
      * A slider component with a dynamically displayed value. The range is simulated based on the trip details (e.g., $300 - $3000 for a Bangalore to Goa trip).
  * **Call to Action:**
      * A prominent button with the text: "Create my plan\!"
### Screen 3: The Itinerary View
  * **Header:**
      * A personalized trip title (e.g., "Deepak's Goa Party Trip").
  * **Main Content:**
      * **Tab Navigation:** Tabs for each day of the trip (e.g., "Day 1", "Day 2").
      * **Day's Summary:** For the selected day, this includes:
          * A heading for the day's theme (e.g., "Beach Day at Baga").
          * An "AI Summary" paragraph.
          * A series of recommendation cards for flights, hotels, or activities.
  * **Recommendation Card Component:**
      * Displays an icon, title, key details, and an estimated price.
      * Includes a checked checkbox to indicate the item is part of the plan.
      * Features an optional "plus" icon for upselling options (e.g., "Upgrade to a 5-star hotel for $100 more").
### Screen 4: The Cart/Summary Page
  * **Header:**
      * Title: "Your Trip Summary"
  * **Main Content:**
      * A list of all selected items from the itinerary with their individual prices.
      * A prominent display of the "Total Trip Cost".
  * **Recommendations Section:**
      * Heading: "Improve Your Trip"
      * Cards with suggestions for upgrades or add-ons, each with an "Add to Trip" button.
  * **Call to Action:**
      * A button: "Proceed to Checkout" (non-functional).
### Screen 5: The AI Chatbot Interface
  * **Activation:** A floating action button (FAB) with a chat icon, visible on the Itinerary and Cart screens.
  * **Interface:** A modal or slide-up panel with:
      * Header: "Planner AI"
      * A chat window to display the conversation.
      * A text input field with "Send" and "Microphone" icon buttons.
  * **Mock Functionality:**
      * User types a request (e.g., "Change my budget to $500").
      * The app simulates the AI processing the request and displays a confirmation.
      * The chat interface closes, and the budget is updated on the underlying screen.
## Mock Data Structure
The application is powered by a mock JSON object. The data structure is as follows:
```json
{
  "title": "Deepak's Goa Party Trip",
  "total_budget": 450,
  "days": [
    {
      "day_number": 1,
      "theme": "Beach Day at Baga",
      "ai_summary": "Get ready to soak up the sun! Today is all about relaxing at Baga beach, enjoying some great food, and preparing for an exciting night.",
      "recommendations": [
        {
          "id": 1,
          "type": "flight",
          "title": "Recommended Flight Options",
          "details": "Departure from BLR airport, Arrival at GOI airport",
          "provider": "Indigo",
          "price": 100,
          "included": true,
          "upsell_options": [
            {
              "title": "Book in-flight meals",
              "additional_cost": 15
            }
          ]
        },
        {
          "id": 2,
          "type": "hotel",
          "title": "Check into XYZ Hotel",
          "details": "3 days stay between D1 and D2",
          "provider": "XYZ Hotel Group",
          "price": 200,
          "included": true,
          "upsell_options": []
        }
      ]
    }
  ]
}
```
## Suggested Tech Stack
  * **Framework:** React (or a similar framework like Vue.js).
  * **Styling:** Tailwind CSS or a CSS-in-JS library for easy theming and responsive design.
  * **State Management:** React Context API or a lightweight library like Zustand for managing application state.
  * **Icons:** A library like `react-icons`.
## Getting Started
To run this project locally:
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd ease-my-plan
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Start the development server:**
    ```bash
    npm start
    ```
## Final Implementation Notes
  * **State Management:** The application state (like selected themes, budget, and items in the cart) must be managed so that changes on one screen are reflected on others.
  * **Responsiveness:** The layout must adapt gracefully to different screen sizes, from mobile phones to tablets.
  * **No Backend:** All logic is front-end only, using the mock data provided. No actual API calls are needed.
