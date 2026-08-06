# Deploy Admin Dashboard to Vercel

## Quick Start (5 Minutes)

Your admin dashboard is ready to deploy! Follow these steps:

### Step 1: Go to Vercel Dashboard
- Visit https://vercel.com/dashboard
- Sign in with your account

### Step 2: Create New Project
- Click **"Add New"** button (top right)
- Select **"Project"**

### Step 3: Import Repository
- Select your GitHub repository: **AbhiGandhi-A/Madadwala-Backend**
- Click **"Import"**

### Step 4: Configure Project Settings

When prompted for settings, make these changes:

**Root Directory:**
- Click the dropdown next to "Root Directory"
- Select: `admin`
- ✅ This tells Vercel to deploy the admin folder

**Build & Output:**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**Environment Variables:**
Add one environment variable:
- Key: `NEXT_PUBLIC_API_URL`
- Value: `https://madadwala-backend.vercel.app/api`

Click **"Add"** to confirm

### Step 5: Deploy!
- Click **"Deploy"**
- Wait 2-3 minutes for deployment to complete
- You'll get a URL like: `admin-dashboard-xxxxx.vercel.app`

---

## After Deployment

### ✅ Your Setup Will Be:
```
Backend API:        https://madadwala-backend.vercel.app
Admin Dashboard:    https://admin-dashboard-xxxxx.vercel.app
Android App:        Uses backend API (no changes)
```

### ✅ Everything Works Together:
- Backend continues serving Android app ✓
- Admin dashboard manages platform ✓
- All data is real and synced ✓
- No conflicts or issues ✓

---

## Custom Domain (Optional)

After deployment, you can add a custom domain:
1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain (e.g., `admin.yourdomain.com`)
4. Follow DNS setup instructions

---

## Troubleshooting

### Issue: "Root Directory not found"
**Solution:** Make sure you selected the `admin` folder in Step 4

### Issue: "API calls failing"
**Solution:** Verify `NEXT_PUBLIC_API_URL` environment variable is set to:
```
https://madadwala-backend.vercel.app/api
```

### Issue: "Build fails"
**Solution:** Make sure you have `package.json` in the admin folder (it's already there)

---

## Important Notes

✅ **Backend is NOT changed** - It stays deployed as is  
✅ **Android app still works** - No changes needed  
✅ **Admin is separate** - Independent deployment  
✅ **Real data** - Uses your actual backend API  
✅ **Auto-deploys** - Push changes to GitHub and Vercel auto-deploys  

---

## What's Deployed

- 13 complete admin pages
- 10+ management features
- Real-time data from backend
- Responsive design
- Professional UI

---

## Next Steps

1. Deploy using steps above
2. Open your admin dashboard URL
3. Start managing your platform!

Questions? Check QUICKSTART.md or README.md in the admin folder.
