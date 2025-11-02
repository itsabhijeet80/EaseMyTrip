# Complete Application Specification for Ease My Trip - AI-Powered Travel Planning Platform

## Application Overview

**Ease My Trip** is a full-stack, AI-powered travel planning web application that helps users create personalized trip itineraries with day-by-day recommendations for flights, hotels, and activities. The application uses Google Gemini AI to generate travel vibes/themes for destinations and create comprehensive trip plans based on user preferences, budget, and custom requirements.

### Core Purpose
Users can plan trips by providing departure/destination cities, travel dates, selecting a theme/vibe, setting a budget, and optionally adding custom requests. The AI then generates a detailed itinerary with specific recommendations, prices, and providers for each day of the trip.

---

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.20
- **Routing**: Wouter 3.3.5 (lightweight React router)
- **State Management**: 
  - Zustand 5.0.8 (global state)
  - React Query (TanStack Query) 5.60.5 (server state)
- **UI Components**: 
  - Radix UI primitives (full set: dialogs, dropdowns, tabs, etc.)
  - Custom shadcn/ui components
  - Lucide React icons 0.453.0
- **Styling**: 
  - Tailwind CSS 3.4.17
  - Tailwind CSS Animate 1.0.7
  - CSS variables for theming
- **Forms**: React Hook Form 7.55.0 with Zod 3.24.2 validation
- **Date Handling**: React Day Picker 8.10.1, date-fns 3.6.0
- **Animations**: Framer Motion 11.13.1
- **Charts**: Recharts 2.15.2 (for budget insights)

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 4.21.2
- **TypeScript Runtime**: tsx 4.20.5 (for development)
- **AI Integration**: 
  - @google/genai 1.20.0 (Gemini AI)
  - Optional: ElevenLabs API for text-to-speech
- **Database**: 
  - Drizzle ORM 0.39.1
  - PostgreSQL schema (in-memory storage for development)
  - Neon Serverless adapter for production
- **Validation**: Zod 3.24.2 with drizzle-zod
- **HTTP Server**: Native Node.js http.createServer

### Development Tools
- **TypeScript**: 5.6.3
- **Cross-env**: 10.1.0 (environment variables)
- **Vite Plugins**: 
  - @vitejs/plugin-react
  - @replit/vite-plugin-runtime-error-modal
- **PostCSS** and **Autoprefixer** for CSS processing

---

## Application Architecture

### Project Structure
```
EaseMyTrip-main/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── pages/       # Route pages (home, itinerary, cart, profile, not-found)
│   │   ├── components/  # Reusable components
│   │   │   ├── ui/      # shadcn/ui components (50+ components)
│   │   │   ├── chat-modal.tsx
│   │   │   ├── floating-chat-button.tsx
│   │   │   ├── budget-insights.tsx
│   │   │   ├── smart-suggestions.tsx
│   │   │   └── footer-navigation.tsx
│   │   ├── hooks/       # Custom React hooks
│   │   │   ├── use-trip-store.ts (Zustand)
│   │   │   ├── use-speech-recognition.ts
│   │   │   └── use-toast.ts
│   │   ├── lib/         # Utilities
│   │   │   ├── api.ts (API client)
│   │   │   ├── queryClient.ts (React Query setup)
│   │   │   └── utils.ts
│   │   ├── App.tsx      # Main app component
│   │   ├── main.tsx     # Entry point
│   │   └── index.css    # Global styles
│   └── public/
│       └── images/vibes/ # Vibe category images (24 images)
├── server/              # Backend Express application
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API route handlers
│   ├── storage.ts       # In-memory data storage
│   ├── vite.ts          # Vite middleware setup
│   ├── api-handler.ts   # Vercel/serverless handler
│   └── services/
│       ├── gemini.ts    # Gemini AI integration
│       └── elevenlabs.ts # Text-to-speech (optional)
├── shared/              # Shared code between frontend/backend
│   └── schema.ts        # Zod schemas and database types
├── dist/                # Build output
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── drizzle.config.ts
```

### Development Server Architecture
- **Port**: 5000 (both frontend and backend served together)
- **Mode**: Single server serving both API and frontend
- **Development**: Vite middleware integrated with Express for HMR
- **Production**: Static file serving from dist/public

---

## Core Features & Functionality

### 1. Trip Planning (Home Page)

**User Flow:**
1. User enters departure city (from) and destination (to) using dropdown selects
2. User selects start date and end date using calendar picker
3. Upon destination selection, AI generates travel vibes/themes for that destination
4. User selects a vibe/theme from horizontally scrollable cards
5. User sets budget using a slider component (range: ₹10,000 - ₹500,000 INR)
6. Optional: User can add custom request text
7. Optional: User can enable advanced options:
   - Select All (auto-select all recommendations)
   - Include Flights (include flight recommendations)
   - Auto Book (suggest easily bookable options)
   - Local Recommendations (prioritize local, authentic experiences)
8. User clicks "Create my perfect plan" button
9. AI generates complete itinerary with day-by-day recommendations

**UI Details:**
- Form validation with real-time error messages
- Loading states during vibe generation and trip creation
- Vibe cards display:
  - Category-specific emoji icons
  - Gradient background colors matching vibe type
  - Vibe name (e.g., "Beach & Chill", "Adventure Sports")
  - Category description (e.g., "Sun-soaked shores")
- Budget slider shows:
  - Current selected value in INR (₹)
  - Min/max range labels
  - Visual slider with smooth animations
- Custom request field:
  - Multi-line textarea
  - Placeholder text with examples
  - Character counter
- Advanced options:
  - Collapsible section with checkboxes
  - Tooltips explaining each option
- Submit button:
  - Disabled until all required fields filled
  - Loading spinner during generation
  - Success redirect to itinerary page

**API Endpoints Used:**
- `POST /api/vibes` - Generate travel vibes for destination (cached for 1 hour)
- `POST /api/generate-trip` - Generate complete trip plan

### 2. Itinerary Page (Day-by-Day View)

**Single Day View:**
- Only one day displayed at a time
- Day tabs at top for navigation
- Clicking a tab shows only that day's content
- Auto-scrolls to top when switching days
- Default shows Day 1 on load

**Day Header:**
- Day number badge (styled circle with number)
- Day label (e.g., "Day 1")
- Date display (e.g., "Mon, Nov 4")
- Day theme title (e.g., "Beach Day at Baga")
- AI-generated summary paragraph
- Activity count badge
- Custom request badge (if present, shown on Day 1 only)

**Activities Display:**
Activities are organized into three sections:

**Flights & Transportation:**
- ✈️ Icon header
- Cards show:
  - Airline/provider name
  - Flight route details
  - Price in INR
  - Included checkbox (default checked)
  - Clock icon with duration estimate
  - Star rating (4.5)

**Accommodations:**
- 🏨 Icon header
- Hotel cards show:
  - Hotel name
  - Description/details
  - Provider/platform
  - Price per night
  - Included checkbox
  - Duration estimate
  - Star rating

**Activities & Experiences:**
- 🎯 Icon header
- Activity cards show:
  - Activity name
  - Detailed description
  - Provider/tour operator
  - Price
  - Included checkbox
  - Time estimate (1-2 hours)
  - Star rating

**Day Summary Section:**
- Three-column grid:
  - Activities count
  - Total cost for day (₹)
  - Estimated duration (e.g., "8hr")
- BarChart3 icon header

**Interactions:**
- Toggle included/excluded status via checkbox (updates backend)
- Smooth transitions when switching days
- Empty state message if no activities for a day

**API Endpoints:**
- `GET /api/trips/:id/cart` - Fetch cart items for trip
- `PATCH /api/cart/:id` - Update cart item (e.g., included status)

### 3. Shopping Cart / Trip Summary Page

**Cart Items Section:**
- Lists all included items across all days
- Each item shows:
  - Type icon (flight/hotel/activity)
  - Title
  - Details/description
  - Provider
  - Price
  - Delete button (trash icon)
- Items grouped by type (visual separation)
- Empty state if cart is empty

**Price Breakdown:**
- Accommodation subtotal
- Flights subtotal
- Activities subtotal
- Discount applied (if any)
- Taxes and fees
- **Final Total** (prominently displayed)

**Upgrade Suggestions:**
- Premium upgrade card (if not already added)
- Shows upgrade description
- Additional cost display
- "Add Upgrade" button
- Card dynamically repositions when scrolling near payment section

**Payment Section:**
- "Proceed to Checkout" button (primary, disabled in demo)
- Payment method icons (Credit Card, Shield security badge)
- Trust badges
- Contact support link

**Additional Features:**
- Scroll detection to reposition upgrade card
- Smooth scroll animations
- Responsive layout (mobile-first)

**API Endpoints:**
- `DELETE /api/cart/:id` - Remove item from cart

### 4. AI Chat Assistant (Floating Chat)

**Floating Chat Button:**
- Fixed position (bottom right)
- Chat icon with notification badge (if unread)
- Clicking opens chat modal
- Animated entrance/exit

**Chat Modal Features:**

**Header:**
- "Planner AI" title
- Close button (X)
- Minimize/maximize controls

**Chat Messages:**
- User messages: Right-aligned, primary color background
- AI messages: Left-aligned, muted background
- Timestamp display
- Action messages: Special styling for trip modifications
  - Pending/Confirmed/Rejected status badges
  - Undo button for actions
  - Visual confirmation indicators

**Input Area:**
- Text input field
- Send button (disabled when empty)
- Voice input button (microphone icon)
- Voice recording indicator
- Speech recognition support (Web Speech API)

**Chat Capabilities:**
1. **Trip Planning via Chat:**
   - User can describe trip requirements in natural language
   - AI extracts: from, to, dates, vibe, budget, custom requests
   - Displays trip planning form within chat
   - User confirms to create trip

2. **Trip Modifications:**
   - Change budget
   - Add/remove activities
   - Modify hotel recommendations
   - Change theme/vibe
   - Add/remove days
   - Optimize budget

3. **General Travel Questions:**
   - Destination information
   - Travel tips
   - Weather queries
   - Local recommendations

4. **Voice Input:**
   - Speech-to-text using browser API
   - Visual recording indicator
   - Transcribes to text input

**API Endpoints:**
- `POST /api/chat` - Send chat message, get AI response
- `POST /api/detect-action` - Detect user intent for trip modifications
- `POST /api/trips/:id/modify` - Execute trip modification
- `POST /api/trips/:id/optimize-budget` - Get budget optimization suggestions
- `POST /api/trips/:id/recommendations` - Get smart recommendations for a day
- `POST /api/user/insights` - Get personalized user insights

### 5. Smart Suggestions Component

**Context-Aware Recommendations:**
- Appears on itinerary page
- Suggests additional activities based on:
  - Current day's theme
  - Already selected activities
  - User preferences
  - Popular combinations

**Display:**
- Card-based layout
- "People also added" section
- Percentage indicators (e.g., "75% of travelers add this")
- "Add to Trip" buttons
- Scrollable horizontal list

### 6. Budget Insights Component

**Visual Analytics:**
- Pie chart showing budget breakdown:
  - Accommodation percentage
  - Flights percentage
  - Activities percentage
- Total cost display
- Savings opportunities highlighted
- Budget optimization suggestions

### 7. Footer Navigation

**Fixed Bottom Navigation:**
- Home icon (navigates to home page)
- Trips icon (future: trip history)
- Cart icon (navigates to cart page, shows item count badge)
- Profile icon (navigates to profile page)
- Active state highlighting
- Smooth page transitions

### 8. Profile Page (Basic)

**User Information:**
- Profile picture placeholder
- Username display
- Trip history (future expansion)
- Preferences (future expansion)

---

## Database Schema

### Users Table
```typescript
{
  id: string (UUID, primary key)
  username: string (unique, not null)
  password: string (not null) - hashed in production
}
```

### Trips Table
```typescript
{
  id: string (UUID, primary key)
  userId: string (foreign key to users.id, nullable)
  title: string (not null) - AI-generated trip title
  from: string (not null) - departure city
  to: string (not null) - destination city
  startDate: string (not null) - ISO date string
  endDate: string (not null) - ISO date string
  theme: string (not null) - selected vibe/theme
  budget: number (not null) - in INR
  days: JSONB (not null) - array of day objects with:
    {
      day_number: number
      date: string (ISO date)
      theme: string
      summary: string
      ai_summary: string
      recommendations: array of recommendation objects
    }
  createdAt: timestamp (default now)
  
  // Metadata (stored as JSONB or attached to object):
  customRequest?: string
  advancedOptions?: {
    selectAll?: boolean
    includeFlights?: boolean
    autoBook?: boolean
    localRecommendations?: boolean
  }
}
```

### Cart Items Table
```typescript
{
  id: string (UUID, primary key)
  tripId: string (foreign key to trips.id)
  type: string (not null) - 'flight' | 'hotel' | 'activity'
  title: string (not null)
  details: string (not null)
  provider: string (nullable) - e.g., "IndiGo", "MakeMyTrip"
  price: number (not null) - in INR
  included: boolean (default true)
  dayNumber: number (nullable) - which day this item belongs to
}
```

---

## API Endpoints Specification

### POST /api/vibes
**Request:**
```json
{
  "destination": "goa"
}
```

**Response:**
```json
{
  "vibes": ["Beach & Chill", "Party & Nightlife", "Cultural Exploration", ...]
}
```

**Details:**
- Cached for 1 hour (in-memory cache)
- Uses fixed database of vibes for major cities
- Falls back to AI generation if not in database
- Always returns array (fallback on error)

### POST /api/generate-trip
**Request:**
```json
{
  "from": "bangalore",
  "to": "goa",
  "startDate": "2024-11-02",
  "endDate": "2024-11-05",
  "theme": "Beach & Chill",
  "budget": 135000,
  "customRequest": "I want beachfront hotels and water sports",
  "advancedOptions": {
    "includeFlights": true,
    "autoBook": true,
    "localRecommendations": false
  }
}
```

**Response:**
```json
{
  "trip": {
    "id": "uuid",
    "title": "Goa Beach & Chill Adventure",
    "from": "bangalore",
    "to": "goa",
    ...
  },
  "plan": {
    "title": "Goa Beach & Chill Adventure",
    "ai_summary": "A 3-day beach adventure...",
    "days": [
      {
        "day_number": 1,
        "date": "2024-11-02",
        "theme": "Beach Day",
        "ai_summary": "Start your beach adventure...",
        "recommendations": [
          {
            "id": 1,
            "type": "flight",
            "title": "Flight from Bangalore to Goa",
            "details": "IndiGo 6E-123, Departure 8:00 AM",
            "provider": "IndiGo",
            "price": 3500,
            "included": true
          },
          ...
        ]
      }
    ]
  }
}
```

**Details:**
- Creates trip in database
- Creates cart items for each recommendation
- Handles both 'recommendations' and 'items' fields for compatibility
- Stores customRequest and advancedOptions as metadata

### GET /api/trips/:id
Returns trip by ID.

### GET /api/trips/:id/cart
Returns all cart items for a trip.

### PATCH /api/cart/:id
Updates cart item (e.g., included status).
**Request:**
```json
{
  "included": false
}
```

### DELETE /api/cart/:id
Deletes cart item.

### POST /api/chat
**Request:**
```json
{
  "message": "I want to plan a trip to Goa",
  "tripId": "uuid" // optional
}
```

**Response:**
```json
{
  "response": "I'd be happy to help you plan a trip to Goa!..."
}
```

### POST /api/detect-action
Detects user intent for trip modifications.

### POST /api/trips/:id/modify
Executes trip modification (e.g., change budget, add activity).

### POST /api/trips/:id/optimize-budget
Returns budget optimization suggestions.

### POST /api/trips/:id/recommendations
Returns smart recommendations for a specific day.

### POST /api/user/insights
Returns personalized user insights based on trip history.

---

## AI Integration Details (Google Gemini)

### Model Used
- **Primary Model**: `gemini-2.5-flash`
- **API Package**: @google/genai v1.20.0

### AI Functions

**1. generateVibes(destination: string)**
- **Purpose**: Generate 6 travel vibes/themes for a destination
- **Process**:
  1. Check fixed vibes database (major Indian and international cities)
  2. If not found and GEMINI_API_KEY available, use AI
  3. Fallback to generic vibes if AI fails
- **Prompt**: "Generate 6 unique travel vibes/themes for {destination}..."
- **Response Format**: JSON array of strings

**2. generateTripPlan(...)**
- **Purpose**: Generate complete day-by-day trip itinerary
- **Input Parameters**:
  - from, to, startDate, endDate, theme, budget
  - customRequest (optional)
  - advancedOptions (optional)
- **Process**:
  1. Validate customRequest (if provided) using AI
  2. Build comprehensive prompt with:
     - Trip details
     - Custom request section (if valid)
     - Advanced options instructions
  3. Request JSON response with specific structure
  4. Validate response structure
  5. Fallback to default plan if AI fails
- **Response Structure**:
  ```json
  {
    "title": "Trip title",
    "ai_summary": "Overview",
    "days": [
      {
        "day_number": 1,
        "date": "YYYY-MM-DD",
        "summary": "Day overview",
        "theme": "Day theme",
        "ai_summary": "Day summary",
        "recommendations": [
          {
            "id": 1,
            "type": "flight|hotel|activity",
            "title": "Item title",
            "details": "Description",
            "provider": "Provider name",
            "price": 3500,
            "included": true
          }
        ]
      }
    ]
  }
  ```
- **Fallback Plan**: If GEMINI_API_KEY missing or AI fails, generates default plan with:
  - Flights on first/last day (if includeFlights enabled)
  - Hotels for each day
  - Activities matching theme
  - Prices distributed within budget

**3. chatWithAI(message: string, tripContext?: any)**
- **Purpose**: Handle conversational AI chat
- **Features**:
  - Validates if message is travel-related
  - Provides helpful travel advice
  - Can reference current trip context

**4. detectTripAction(message: string, tripContext?: any)**
- **Purpose**: Detect user intent for trip modifications
- **Detects Actions**:
  - modify_budget
  - add_activity
  - remove_activity
  - change_hotel
  - add_day
  - remove_day
  - change_theme
  - optimize_budget

**5. extractTripDetailsFromMessage(message: string, ...)**
- **Purpose**: Extract trip planning details from natural language
- **Extracts**: from, to, dates, vibe, budget, customRequest

**6. generateSmartRecommendations(tripId, dayNumber, tripContext)**
- **Purpose**: Suggest additional activities based on current trip
- **Includes**: Recommendations, sequences, local insights, popular additions

**7. analyzeBudgetOptimization(tripContext)**
- **Purpose**: Analyze budget and suggest optimizations
- **Returns**: Current breakdown, optimizations, alternatives

**8. generateUserInsights(userProfile)**
- **Purpose**: Generate personalized insights based on user history
- **Returns**: Travel personality, insights, recommendations, achievements

### AI Prompt Engineering Details

**Custom Request Integration:**
- Custom requests are validated first (travel-related check)
- If valid, prominently included in trip generation prompt
- Instructions to incorporate into:
  - Overall trip summary
  - Hotel recommendations (titles and details)
  - Activity recommendations
  - Day-by-day planning

**Advanced Options Integration:**
- `includeFlights: false` → Excludes flight recommendations
- `includeFlights: true` → Includes detailed flight recommendations
- `autoBook: true` → Suggests easily bookable online options
- `localRecommendations: true` → Prioritizes local, authentic experiences

**Error Handling:**
- All AI functions have fallback mechanisms
- Graceful degradation if API key missing
- Validation of AI responses before using
- Logging for debugging

---

## UI/UX Design Specifications

### Color Palette & Theming
- **System**: Uses CSS variables for theme support (light/dark mode ready)
- **Primary Colors** (HSL format):
  - Background: `hsl(var(--background))`
  - Foreground: `hsl(var(--foreground))`
  - Primary: `hsl(var(--primary))` - Bright blue for active states
  - Secondary: `hsl(var(--secondary))`
  - Muted: `hsl(var(--muted))` - For subtle backgrounds
  - Accent: `hsl(var(--accent))`
  - Destructive: `hsl(var(--destructive))` - For delete actions
- **Border**: `hsl(var(--border))`
- **Card**: `hsl(var(--card))` and `hsl(var(--card-foreground))`

### Typography
- **Primary Font**: Inter (system fallback)
- **Font Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)
- **Hierarchy**:
  - Page titles: `text-2xl font-bold`
  - Section headings: `text-xl font-semibold`
  - Card titles: `text-sm font-semibold`
  - Body text: `text-sm` or `text-xs`
  - Muted text: `text-muted-foreground`

### Spacing & Layout
- **Container Padding**: `p-4 sm:p-6` (responsive)
- **Card Padding**: `p-4` or `p-5`
- **Gap Between Elements**: `gap-2`, `gap-3`, `gap-4`
- **Border Radius**: 
  - Cards: `rounded-xl` (12px)
  - Buttons: `rounded-lg` (8px)
  - Inputs: `rounded-md` (6px)
- **Shadows**: 
  - Cards: `shadow-sm`
  - Hover: `hover:shadow-md`

### Component Styling Patterns

**Buttons:**
- Primary: `bg-primary text-primary-foreground`
- Secondary: `bg-secondary text-secondary-foreground`
- Ghost: `hover:bg-muted`
- Disabled: `opacity-50 cursor-not-allowed`
- Loading: Spinner icon replaces text

**Inputs:**
- Border: `border border-input`
- Focus: `ring-2 ring-ring ring-offset-2`
- Error: `border-destructive`

**Cards:**
- Background: `bg-card`
- Border: `border border-border`
- Hover: `hover:border-primary/30`
- Active: `ring-1 ring-primary/30`

**Badges:**
- Small: `px-2 py-1 text-xs`
- Rounded: `rounded-md` or `rounded-full`
- Color variants: Primary, Secondary, Muted

### Responsive Design
- **Mobile First**: Base styles for mobile
- **Breakpoints**:
  - `sm:` 640px and up
  - `md:` 768px and up
  - `lg:` 1024px and up
- **Mobile Optimizations**:
  - Touch-friendly tap targets (min 44px)
  - Horizontal scrolling for vibe cards
  - Stacked layouts on mobile
  - Fixed bottom navigation

### Animations & Transitions
- **Transitions**: `transition-all` on interactive elements
- **Hover Effects**: Scale, shadow, color changes
- **Loading States**: Skeleton loaders, spinners
- **Page Transitions**: Smooth fade/slide (via Wouter)
- **Scroll Behavior**: `smooth` scrolling

### Vibe Card Styling
Each vibe card has:
- **Gradient Background**: Category-specific (beach = orange-yellow, party = purple-pink, etc.)
- **Emoji Icon**: Large emoji matching category
- **Text**: Vibe name in bold, category description below
- **Hover Effect**: Scale up slightly, border highlight
- **Selected State**: Border ring, background color change

### Activity Card Styling
- **Icon Container**: 40x40px rounded square with emoji
- **Content Layout**: Flex row (icon left, content right)
- **Checkbox**: Top right corner
- **Metadata**: Clock, Dollar, Star icons with values
- **Spacing**: Consistent padding and gaps

---

## State Management

### Zustand Store (use-trip-store.ts)
```typescript
interface TripStore {
  // Current trip
  currentTrip: Trip | null
  setCurrentTrip: (trip: Trip | null) => void
  
  // Cart items
  cartItems: CartItem[]
  setCartItems: (items: CartItem[]) => void
  
  // Selected day (for itinerary)
  selectedDay: number | null
  setSelectedDay: (day: number) => void
  
  // Helper functions
  getTotalCost: () => number
  upgradeAdded: boolean
  setUpgradeAdded: (value: boolean) => void
}
```

### React Query Configuration
- **Query Client**: Configured with default options
- **Cache Time**: 5 minutes for most queries
- **Stale Time**: 1 minute
- **Retry**: 2 attempts on failure
- **Refetch**: On window focus (configurable per query)

---

## Environment Variables

Required environment variables:
```bash
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Database (for production)
DATABASE_URL=postgresql://...

# Optional: ElevenLabs for text-to-speech
ELEVENLABS_API_KEY=your_key_here
```

---

## Build & Deployment Configuration

### Development
- **Command**: `npm run dev`
- **Process**: 
  1. Starts Express server on port 5000
  2. Integrates Vite middleware for HMR
  3. Serves both API and frontend from same port
- **Hot Module Replacement**: Enabled for frontend
- **TypeScript**: Compiled on-the-fly with tsx

### Production Build
- **Frontend**: `npm run build:frontend`
  - Output: `dist/public/`
  - Vite bundles and optimizes React app
- **Backend**: `npm run build:backend`
  - Output: `dist/api-handler.js`
  - esbuild bundles serverless handler
- **Full Build**: `npm run build`

### Deployment Targets
- **Vercel**: Configured via `vercel.json`
- **Netlify**: Configured via `netlify.toml`
- **Render**: Configured via `render.yaml`
- **Manual**: Node.js server with `npm start`

---

## Additional Features & Details

### Loading States
- Skeleton loaders for async content
- Spinner overlays for form submissions
- Progress indicators for long operations

### Error Handling
- Toast notifications for errors
- Form validation errors displayed inline
- Fallback UI for failed API calls
- Graceful degradation when AI unavailable

### Accessibility
- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management in modals
- Screen reader friendly

### Performance Optimizations
- Image lazy loading
- Code splitting (route-based)
- API response caching (vibes cached for 1 hour)
- Debounced input handlers
- Memoized components where appropriate

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement approach

---

## File Naming Conventions

- **Components**: PascalCase (e.g., `ChatModal.tsx`)
- **Pages**: lowercase with hyphens (e.g., `itinerary.tsx`)
- **Hooks**: camelCase with `use-` prefix (e.g., `use-trip-store.ts`)
- **Utilities**: camelCase (e.g., `api.ts`, `utils.ts`)
- **Types**: PascalCase (e.g., `Trip`, `CartItem`)

---

## Testing Considerations

- Components should be testable in isolation
- API endpoints should return consistent error formats
- State management should be predictable
- Form validation should prevent invalid submissions
- Loading and error states should be testable

---

## Future Enhancement Ideas

1. **User Authentication**: Full login/signup system
2. **Trip History**: Save and revisit past trips
3. **Social Sharing**: Share itineraries with friends
4. **Real Booking Integration**: Connect to actual booking APIs
5. **Offline Support**: PWA capabilities
6. **Multi-language Support**: i18n implementation
7. **Dark Mode**: Full dark theme support
8. **Advanced Filters**: Filter activities by price, rating, etc.
9. **Collaborative Planning**: Multiple users edit same trip
10. **Export Options**: PDF, calendar integration

---

## Critical Implementation Notes

1. **Cart Item Creation**: Must handle both `recommendations` and `items` fields from AI response (for compatibility)

2. **Single Day View**: Itinerary page shows only selected day, not all days at once

3. **Default Selection**: Automatically selects Day 1 when itinerary page loads

4. **Custom Request Display**: Only shown on Day 1 header if present

5. **Activity Grouping**: Activities displayed in three sections (Flights, Hotels, Activities) within each day

6. **Price Formatting**: All prices in INR (₹) with proper formatting

7. **Date Formatting**: Dates displayed in readable format (e.g., "Mon, Nov 4")

8. **Empty States**: Proper empty states for empty cart, no activities, etc.

9. **Loading States**: Loading indicators during AI generation and API calls

10. **Error Boundaries**: Error handling at component and app level

---

This specification provides a complete blueprint for recreating the Ease My Trip application. Every feature, component, API endpoint, and design detail has been documented to enable accurate implementation.

