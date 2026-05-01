# Deployment Guide: MrPitani Dashboard

This guide walks you through deploying the MrPitani Dashboard to production using:
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Supabase

## Prerequisites

1. GitHub account (for connecting repositories)
2. Supabase account (free tier available)
3. Vercel account (free tier available)
4. Railway account (free tier available)

---

## Step 1: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down these credentials (you'll need them):
   - Project URL
   - API Key (anon/public)
   - Database password
3. Create database tables by running migrations (if applicable)
4. Create a `.env.local` file in the backend folder with database credentials

---

## Step 2: Prepare Backend for Railway

### Create Required Files

The following files have been created in your backend directory:
- `Procfile` - Tells Railway how to start your app
- `runtime.txt` - Specifies Python version
- `.env.example` - Template for environment variables

### Backend Environment Variables

Create these environment variables in Railway:

```
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=your-secret-key-generate-a-random-string
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
AWS_ACCESS_KEY_ID=your-aws-key (if using S3)
AWS_SECRET_ACCESS_KEY=your-aws-secret (if using S3)
FRONTEND_URL=https://your-vercel-app.vercel.app
```

---

## Step 3: Deploy Backend to Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set environment variables in Railway dashboard
6. Railway will automatically deploy when you push to GitHub
7. Get your Railway deployment URL (e.g., `https://your-app-production.up.railway.app`)

---

## Step 4: Configure Frontend for Vercel

### Create Environment Variables File

The file `.env.local.example` is provided. Configure it:

```
REACT_APP_API_URL=https://your-railway-url.up.railway.app
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_KEY=your-supabase-key
```

### Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the `frontend` folder as the root directory
5. Add environment variables (from your `.env.local` file)
6. Click "Deploy"
7. Vercel will automatically deploy on every push to main/master

---

## Step 5: Update CORS Settings

In your backend `server.py`, update CORS to allow your Vercel domain:

```python
CORS_ORIGINS = [
    "https://your-vercel-app.vercel.app",
    "http://localhost:3000",  # for local development
]
```

---

## Step 6: Update API Calls in Frontend

Make sure your frontend API calls use the environment variable:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

axios.defaults.baseURL = API_URL;
```

---

## Verification Checklist

- [ ] Supabase project created with database
- [ ] Backend environment variables set in Railway
- [ ] Frontend environment variables set in Vercel
- [ ] CORS configured for your Vercel domain
- [ ] Backend deployed and accessible at Railway URL
- [ ] Frontend deployed and accessible at Vercel URL
- [ ] Frontend can connect to backend (check network requests)
- [ ] Database queries work correctly in production

---

## Troubleshooting

### Backend won't start on Railway
- Check logs in Railway dashboard
- Verify DATABASE_URL is correct
- Ensure all Python dependencies are in `requirements.txt`

### Frontend can't connect to backend
- Check browser console for CORS errors
- Verify REACT_APP_API_URL is set correctly
- Check backend CORS configuration

### Database connection fails
- Verify DATABASE_URL format
- Check Supabase credentials
- Ensure database is not in read-only mode

---

## Next Steps

- Set up monitoring and error tracking (Sentry)
- Configure email notifications for errors
- Set up automatic backups for database
- Plan scaling strategy for production traffic
