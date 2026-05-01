# Deployment Checklist

Complete these steps in order to deploy MrPitani Dashboard to production.

## Pre-Deployment Setup

### Accounts & Credentials
- [ ] Create Supabase account at https://supabase.com
- [ ] Create Railway account at https://railway.app
- [ ] Create Vercel account at https://vercel.com
- [ ] Have GitHub account and repository ready

### Supabase Setup
- [ ] Create new Supabase project
- [ ] Copy Project URL: `_________________________`
- [ ] Copy Anon Key: `_________________________`
- [ ] Get PostgreSQL connection string from Database settings
- [ ] Database URL: `_________________________`
- [ ] Test database connection in Supabase console

### Repository Preparation
- [ ] Git repository initialized
- [ ] All changes committed and pushed to GitHub
- [ ] Repository is public or Railway/Vercel have access
- [ ] GitHub repository URL: `_________________________`

---

## Phase 1: Backend Deployment (Railway)

### Environment Preparation
- [ ] All required env vars identified
- [ ] JWT_SECRET generated (minimum 32 characters): `_________________________`
- [ ] DATABASE_URL copied from Supabase
- [ ] Supabase credentials noted

### Deploy to Railway
- [ ] Signed into https://railway.app
- [ ] Connected GitHub account
- [ ] Created new project from GitHub repo
- [ ] Selected backend folder (if using monorepo)
- [ ] Initial deployment in progress/completed
- [ ] Railway deployment domain: `_________________________`

### Configure Environment Variables
- [ ] DATABASE_URL set in Railway
- [ ] JWT_SECRET set in Railway
- [ ] SUPABASE_URL set in Railway
- [ ] SUPABASE_KEY set in Railway
- [ ] CORS_ORIGINS set to temporary value: `http://localhost:3000`
- [ ] All env vars added and deployment restarted

### Verify Backend Deployment
- [ ] Backend service shows "Healthy" status in Railway
- [ ] Can access Railway deployment URL
- [ ] Health check endpoint responds (e.g., `/docs` for FastAPI)
- [ ] Logs show no errors in Railway console

---

## Phase 2: Frontend Deployment (Vercel)

### Environment Preparation
- [ ] REACT_APP_API_URL will be: `_________________________`
- [ ] REACT_APP_SUPABASE_URL noted: `_________________________`
- [ ] REACT_APP_SUPABASE_KEY noted: `_________________________`

### Deploy to Vercel
- [ ] Signed into https://vercel.com
- [ ] Connected GitHub account
- [ ] Created new project from repository
- [ ] Set Root Directory to: `frontend`
- [ ] Framework selected: React
- [ ] Added environment variables:
  - [ ] REACT_APP_API_URL
  - [ ] REACT_APP_SUPABASE_URL
  - [ ] REACT_APP_SUPABASE_KEY
- [ ] Deployment completed successfully
- [ ] Vercel deployment URL: `_________________________`

### Verify Frontend Deployment
- [ ] Frontend loads without errors
- [ ] Can see the login/dashboard page
- [ ] No CORS errors in browser console
- [ ] Network requests show correct API endpoint

---

## Phase 3: Final Configuration

### Update Backend CORS
- [ ] Go to Railway backend service
- [ ] Update CORS_ORIGINS variable to: `https://<your-vercel-url>.vercel.app,http://localhost:3000`
- [ ] Save changes and restart service
- [ ] Wait for deployment to complete

### Test Cross-Service Communication
- [ ] Open frontend in browser
- [ ] Attempt login or data fetch
- [ ] Check Network tab - should see successful API calls
- [ ] Check Console - should have no CORS errors
- [ ] Verify database queries work (if available in UI)

### Test Database Connection
- [ ] Check if data appears in frontend
- [ ] Verify database operations (create, read, update, delete)
- [ ] Check Railway logs for any database errors
- [ ] Test with sample data

---

## Production Readiness

### Security
- [ ] JWT_SECRET is random and secure (32+ chars)
- [ ] No secrets committed to git
- [ ] .env files added to .gitignore
- [ ] CORS configured to specific domains only
- [ ] API keys rotated or regenerated for production

### Performance
- [ ] Frontend build is optimized
- [ ] Images optimized for web
- [ ] Database indexes created (if needed)
- [ ] Caching configured appropriately

### Monitoring
- [ ] Railway has logging enabled
- [ ] Vercel deployment monitoring active
- [ ] Error tracking setup (optional: Sentry)
- [ ] Database backups configured

### Documentation
- [ ] Deployment steps documented
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Rollback procedure known

---

## URLs for Reference

| Service | URL |
|---------|-----|
| Frontend (Vercel) | `https://<your-app>.vercel.app` |
| Backend (Railway) | `https://<your-api>.up.railway.app` |
| Database (Supabase) | `https://<project>.supabase.co` |
| Railway Dashboard | https://railway.app/dashboard |
| Vercel Dashboard | https://vercel.com/dashboard |
| Supabase Console | https://supabase.com/dashboard |

---

## Troubleshooting Section

### Issue: Backend won't build on Railway

**Checklist:**
- [ ] `Procfile` exists in backend root
- [ ] `runtime.txt` exists in backend root
- [ ] `requirements.txt` includes gunicorn
- [ ] Python version in runtime.txt is valid
- [ ] No syntax errors in server.py

**Fix:**
Check Railway logs for specific error message and search for solutions.

### Issue: Frontend shows blank page or fails to load

**Checklist:**
- [ ] Build command in package.json is correct
- [ ] Root directory in Vercel is set to `frontend`
- [ ] All environment variables set in Vercel
- [ ] Node version compatibility checked
- [ ] No failed dependencies in build logs

**Fix:**
Clear Vercel cache and redeploy.

### Issue: CORS errors when frontend tries to call backend

**Checklist:**
- [ ] CORS_ORIGINS env var set correctly in Railway
- [ ] Frontend URL exactly matches CORS_ORIGINS entry
- [ ] REACT_APP_API_URL matches Railway domain
- [ ] Backend restarted after CORS_ORIGINS change
- [ ] Browser developer tools show what URL is being called

**Fix:**
Update CORS_ORIGINS, restart backend, and hard-refresh frontend.

### Issue: Database connection fails

**Checklist:**
- [ ] DATABASE_URL format is correct
- [ ] Supabase project is active
- [ ] Password doesn't contain special characters (or is URL encoded)
- [ ] No IP restrictions on Supabase

**Fix:**
Generate new connection string from Supabase dashboard.

---

## Completion

- [ ] All items above checked
- [ ] System deployed and working
- [ ] Team notified of deployment
- [ ] Monitoring enabled
- [ ] Backup plan in place
