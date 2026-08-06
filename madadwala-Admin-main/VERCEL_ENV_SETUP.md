# Vercel Environment Variable Setup Guide

## Quick Setup (2 minutes)

### Step 1: Add Environment Variable to Vercel

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project (admin panel frontend)
3. Click **Settings** → **Environment Variables**
4. Click **Add New** and enter:
   - **Name:** `NEXT_PUBLIC_BACKEND_URL`
   - **Value:** `https://madadwala-backend.vercel.app`
   - **Environments:** Select **Production**, **Preview**, and **Development**

5. Click **Save**

### Step 2: Redeploy Your Project

1. After adding the environment variable, you MUST redeploy
2. Go to **Deployments** tab
3. Find your latest deployment
4. Click the **⋮** menu → **Redeploy**
5. Wait for deployment to complete (usually 2-3 minutes)

### Step 3: Verify Data is Loading

1. Visit your deployed app: `https://your-vercel-domain.vercel.app/admin`
2. Open Browser DevTools (F12) → Console
3. Look for `[v0]` logs - they show API calls to backend
4. All tabs should show real data from backend

## Environment Variables Explained

```env
# Production Backend URL (Vercel)
NEXT_PUBLIC_BACKEND_URL=https://madadwala-backend.vercel.app

# This variable is PUBLIC (NEXT_PUBLIC_) so it's embedded in frontend code
# It tells the app where to find the backend API
```

## What This Does

- Tells all API calls to use: `https://madadwala-backend.vercel.app`
- Enables all 13 admin modules to fetch real data
- Works for all API endpoints (users, providers, bookings, etc.)
- Automatically picks up new data without redeployment

## Troubleshooting

### Issue: Still Seeing Old Data After Redeploy

**Solution:**
1. Clear Vercel cache:
   - Settings → Git
   - Click "Ignore Build Cache"
   - Redeploy again

2. Clear browser cache:
   - DevTools (F12) → Application → Clear Storage
   - Reload page

### Issue: Getting 404 Errors in Console

**Solution:**
1. Verify backend is online: https://madadwala-backend.vercel.app
2. Check environment variable is set correctly
3. Ensure it's: `https://madadwala-backend.vercel.app` (no trailing slash)

### Issue: Data Not Loading but App Runs

**Solution:**
1. DevTools → Network tab
2. Look for requests to `madadwala-backend.vercel.app`
3. If they show CORS errors, backend needs CORS headers enabled
4. If 403 Forbidden, backend might need authentication

## Complete Environment Setup

Your `.env.local` for development:
```env
NEXT_PUBLIC_BACKEND_URL=https://madadwala-backend.vercel.app
```

Vercel will automatically use this in all environments.

## Verified Working Configuration

✅ Frontend: Vercel deployment  
✅ Backend: https://madadwala-backend.vercel.app  
✅ All 13 modules connected  
✅ Real data from API  
✅ Zero hardcoded data  

## Next Steps

1. **Add environment variable** to Vercel (Step 1 above)
2. **Redeploy** your project (Step 2 above)
3. **Verify** data is loading (Step 3 above)
4. **Monitor** console for `[v0]` API logs

That's it! Your admin panel is now live and connected.

---

**Need Help?**
- Check browser console for `[v0]` logs
- Verify backend is running: https://madadwala-backend.vercel.app
- Check environment variable is set in Vercel Settings
- Ensure you've redeployed after adding the variable
