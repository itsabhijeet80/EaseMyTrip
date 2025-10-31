# Environment Variables Configuration

## Required Environment Variables

### Backend (Render)
```
NODE_ENV=production
PORT=10000
DATABASE_URL=your_neon_database_connection_string
SESSION_SECRET=your_random_session_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (Netlify)
```
VITE_API_URL=https://your-render-backend-url.onrender.com
```

## How to Get These Values

### DATABASE_URL
1. Go to [Neon Console](https://console.neon.tech/)
2. Select your project
3. Copy the connection string from the dashboard
4. Format: `postgresql://username:password@host/database?sslmode=require`

### SESSION_SECRET
- Generate a random string (at least 32 characters)
- You can use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### GEMINI_API_KEY
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the generated key

### VITE_API_URL
- This will be your Render backend URL
- Format: `https://your-app-name.onrender.com`
- Replace `your-app-name` with your actual Render service name