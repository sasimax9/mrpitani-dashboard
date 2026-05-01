# Quick Start Deployment Guide

Follow these steps to deploy your MrPitani Dashboard to production in under 30 minutes.

## Phase 1: Backend Setup (Railway) - 10 minutes

### 1. Create a Supabase Project
- Go to https://supabase.com and sign up
- Create a new project
- Save these credentials:
  - **Project URL**: https://your-project.supabase.co
  - **API Key**: (anon key from Settings → API)
  - **Database Password**: (from Settings → Database)

### 2. Get Database Connection String
In Supabase, go to Settings → Database → URI to find your PostgreSQL connection:
```
postgresql://postgres:password@db.supabase.co:5432/postgres
```

### 3. Push Code to GitHub
```bash
cd /Users/sasikanth/Documents/mrpitani-dashboard
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/mrpitani-dashboard.git
git push -u origin main
```

### 4. Deploy Backend to Railway
1. Go to https://railway.app and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `mrpitani-dashboard` repository
4. Click "Deploy"
5. Once deployment completes, go to Settings → Generate Domain
6. Your backend URL will be something like: `https://mrpitani-api-production.up.railway.app`
7. Add these environment variables in Railway:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase PostgreSQL URI |
| `JWT_SECRET` | Generate a random secure string (32+ chars) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase anon API key |
| `CORS_ORIGINS` | Will update after Vercel deployment |

---

## Phase 2: Frontend Setup (Vercel) - 10 minutes

### 1. Create Vercel Project
1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New..." → "Project"
3. Search for and select your `mrpitani-dashboard` repository
4. In settings:
   - Set **Framework**: React
   - Set **Root Directory**: `frontend`
   - Click "Deploy"

### 2. Configure Frontend Environment Variables
After selecting the repo and before deploying:

1. Click "Environment Variables"
2. Add these variables:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://your-railway-url.up.railway.app` |
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL |
| `REACT_APP_SUPABASE_KEY` | Your Supabase anon key |

3. Click "Deploy"
4. Wait for build to complete
5. Your frontend URL will appear (e.g., `https://mrpitani-dashboard.vercel.app`)

---

## Phase 3: Final Configuration - 5 minutes

### Update Backend CORS Settings
1. In Railway dashboard, go to your backend service
2. Update `CORS_ORIGINS` to:
   ```
   https://your-vercel-url.vercel.app,http://localhost:3000
   ```
3. This allows your frontend to connect to the backend

### Test the Deployment
1. Open your Vercel frontend URL
2. Try logging in or accessing the dashboard
3. Check browser console for any errors
4. If errors, check:
   - Backend logs in Railway (Logs tab)
   - Frontend logs in browser console
   - CORS and environment variable settings

---

## Environment Variables Reference

### Backend (.env or Railway Dashboard)
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-random-secret-32-chars-minimum
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
CORS_ORIGINS=https://your-vercel-url.vercel.app,http://localhost:3000
FRONTEND_URL=https://your-vercel-url.vercel.app
```

### Frontend (.env.local or Vercel Dashboard)
```
REACT_APP_API_URL=https://your-railway-url.up.railway.app
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_KEY=your-anon-key
```

---

## Troubleshooting

### Backend won't deploy
- Check `Procfile` and `runtime.txt` exist in backend folder
- Ensure `requirements.txt` has all dependencies including `gunicorn`
- Check Railway logs for specific errors

### Frontend won't deploy
- Verify Root Directory is set to `frontend`
- Ensure `package.json` build script is correct
- Check Node version compatibility

### Can't connect frontend to backend
- Verify `REACT_APP_API_URL` matches Railway domain
- Check CORS_ORIGINS in Railway settings
- Ensure no typos in environment variables

### Database connection error
- Verify DATABASE_URL format is correct
- Test connection in Supabase dashboard
- Ensure IP isn't blocked by Supabase

---

## Useful Links
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/
