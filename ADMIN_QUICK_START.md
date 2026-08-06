# Admin Dashboard - Quick Start Guide

## 📁 Project Structure

```
Madadwala-Backend/
├── index.js                 ← Express backend (running on port 5000)
├── admin/                   ← Next.js admin dashboard
│   ├── app/                 ← Admin pages and layout
│   ├── components/          ← React components
│   ├── lib/api-client.ts    ← API client for backend communication
│   ├── package.json         ← Admin dependencies
│   └── .env.local           ← Environment configuration
└── ADMIN_SETUP.md          ← Detailed setup instructions
```

## 🚀 Getting Started (5 minutes)

### Step 1: Start the Backend
```bash
# From the root directory
node index.js
```
✅ Backend will run on: `http://localhost:5000`

### Step 2: Install Admin Dependencies
```bash
cd admin
npm install
```

### Step 3: Start the Admin Dashboard
```bash
npm run dev
```
✅ Admin dashboard will run on: `http://localhost:3000`

### Step 4: Open Your Browser
Visit: `http://localhost:3000`

## ✅ What's Already Configured

- ✅ Backend Express server with all required API endpoints
- ✅ CORS enabled for frontend-backend communication
- ✅ Admin dashboard environment configured (`.env.local`)
- ✅ API client ready with all endpoints
- ✅ Next.js setup complete with Tailwind CSS
- ✅ All components and pages configured

## 🔌 How It Works

**Admin Dashboard → API Client → Express Backend**

1. Admin dashboard pages make requests using `/admin/lib/api-client.ts`
2. API client sends requests to `http://localhost:5000/api/*`
3. Express backend processes the request and returns data
4. Admin dashboard displays the data

## 📊 Admin Dashboard Features

- **Dashboard**: Overview of system analytics
- **Users**: Manage all users (block, unblock, delete)
- **Providers**: Approve pending providers, view performance
- **Bookings**: View and manage all bookings
- **Withdrawals**: Approve/reject withdrawal requests
- **Offers & Banners**: Create and manage promotional content
- **Categories**: Manage service categories
- **Analytics**: View system statistics
- **Support**: Manage customer support chats
- **Settings**: Configure platform settings

## 🔧 Important Notes

⚠️ **Do NOT:**
- Modify `index.js` - Backend is already properly configured
- Change backend routes or API structure
- Move or delete the admin folder

✅ **DO:**
- Run backend first, then admin dashboard
- Use the environment file `.env.local` for configuration
- Keep backend running while testing admin dashboard

## 📝 Environment Configuration

The `.env.local` file is already set to:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

To use a different backend URL (e.g., production):
```
NEXT_PUBLIC_BACKEND_URL=https://your-production-backend.com
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to backend" | Ensure backend is running on port 5000 |
| "Port 3000 already in use" | Change to another port: `npm run dev -- -p 3001` |
| "Module not found errors" | Run `npm install` again in the admin folder |
| "CORS errors" | Confirm backend has CORS enabled (it does by default) |
| "Admin dashboard won't load" | Clear browser cache and check console for errors |

## 📚 Full Documentation

For more detailed information, see `ADMIN_SETUP.md`

## 🌐 Deployment

### Production Deployment

1. Update `.env.local`:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-production-backend-url.com
   ```

2. Build admin dashboard:
   ```bash
   npm run build
   ```

3. Deploy to Vercel or your hosting platform

The admin dashboard and backend can be deployed separately as long as the frontend can reach the backend API URL.

## ✨ Next Steps

1. ✅ Run backend: `node index.js`
2. ✅ Install admin: `cd admin && npm install`
3. ✅ Start admin: `npm run dev`
4. ✅ Open browser: `http://localhost:3000`
5. ✅ Start managing your platform!

---

**Need help?** Check the backend console and browser developer tools (F12) for error messages.
