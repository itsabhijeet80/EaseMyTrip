# Deployment Guide: Render + Netlify

This guide will help you deploy your full-stack application with the backend on Render and frontend on Netlify.

## Architecture Overview

- **Backend (API)**: Deployed on Render
- **Frontend (React)**: Deployed on Netlify
- **Database**: Neon PostgreSQL (already configured)

## Prerequisites

1. GitHub repository with your code
2. [Render account](https://render.com)
3. [Netlify account](https://netlify.com)
4. [Neon database](https://neon.tech) (you already have this)
5. [Google AI API key](https://makersuite.google.com) for Gemini

## Step 1: Deploy Backend on Render

### 1.1 Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select your repository

### 1.2 Configure Service
- **Name**: `ease-backend` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your main branch)
- **Build Command**: `npm install && npm run build:backend`
- **Start Command**: `npm start`

### 1.3 Set Environment Variables
Go to "Environment" tab and add:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=your_neon_connection_string
SESSION_SECRET=generate_random_32_char_string
GEMINI_API_KEY=your_gemini_api_key
```

### 1.4 Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your service URL: `https://your-service-name.onrender.com`

## Step 2: Deploy Frontend on Netlify

### 2.1 Prepare Frontend Configuration
1. Update `netlify.toml` and `client/public/_redirects`
2. Replace `your-render-backend-url.onrender.com` with your actual Render URL

### 2.2 Deploy on Netlify
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and select your repository

### 2.3 Configure Build Settings
- **Base directory**: (leave empty)
- **Build command**: `npm run build:frontend`
- **Publish directory**: `dist/public`

### 2.4 Set Environment Variables
Go to "Site settings" → "Environment variables":

```
VITE_API_URL=https://your-render-service.onrender.com
```

### 2.5 Deploy
1. Click "Deploy site"
2. Wait for deployment to complete
3. Your site will be available at: `https://your-site-name.netlify.app`

## Step 3: Update API Configuration

### 3.1 Update Frontend API Calls
If your frontend makes API calls, ensure they use the `VITE_API_URL` environment variable:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### 3.2 Update CORS Settings
In your `server/index.ts`, ensure CORS allows your Netlify domain:

```typescript
app.use(cors({
  origin: ['https://your-site-name.netlify.app', 'http://localhost:5173'],
  credentials: true
}));
```

## Step 4: Database Migration

Run database migrations on Render:

1. Go to your Render service
2. Open "Shell" tab
3. Run: `npm run db:push`

## Step 5: Testing

1. Visit your Netlify URL
2. Test all functionality
3. Check that API calls work correctly
4. Verify database operations

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Add your Netlify domain to CORS origins
   - Ensure credentials are properly configured

2. **API Not Found**
   - Check `_redirects` file in `client/public/`
   - Verify Render URL in `netlify.toml`

3. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all dependencies are in `package.json`
   - Check environment variables

4. **Database Connection**
   - Verify `DATABASE_URL` is correct
   - Check Neon database is accessible
   - Run migrations if needed

### Logs and Debugging

- **Render Logs**: Dashboard → Your Service → Logs
- **Netlify Logs**: Dashboard → Your Site → Functions (for build logs)
- **Browser Console**: Check for API errors

## Custom Domain (Optional)

### For Netlify
1. Go to "Domain settings"
2. Add custom domain
3. Configure DNS records

### For Render
1. Go to "Settings" → "Custom Domains"
2. Add your domain
3. Configure DNS records

## Environment Variables Reference

### Backend (Render)
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `DATABASE_URL`: Your Neon connection string
- `SESSION_SECRET`: Random 32+ character string
- `GEMINI_API_KEY`: Your Google AI API key

### Frontend (Netlify)
- `VITE_API_URL`: Your Render backend URL

## Monitoring and Maintenance

1. **Render**: Monitor service health and logs
2. **Netlify**: Monitor build status and site performance
3. **Database**: Monitor Neon usage and performance
4. **Updates**: Redeploy when you push to your repository

## Security Considerations

1. Never commit API keys to your repository
2. Use environment variables for all secrets
3. Enable HTTPS (automatic on Render and Netlify)
4. Regularly update dependencies
5. Monitor for security vulnerabilities

## Next Steps

1. Set up monitoring and alerts
2. Configure automatic deployments
3. Set up staging environments
4. Implement proper error tracking
5. Add performance monitoring

---

Your application should now be successfully deployed with:
- Backend API running on Render
- Frontend running on Netlify
- Database hosted on Neon
- Secure communication between all services