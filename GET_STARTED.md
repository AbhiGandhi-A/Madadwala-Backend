# 🚀 Get Started - Madadwala Platform

## Welcome! Here's How to Get Everything Running

### 📋 What You Have

You now have a complete Madadwala platform with:
- ✅ **Backend**: Express.js server (in `index.js`)
- ✅ **Admin Dashboard**: Next.js admin panel (in `/admin` folder)
- ✅ Everything is configured and ready to go

### ⏱️ Time Required: 5 Minutes

---

## Step 1️⃣: Start the Backend

**Open a terminal and run:**

```bash
node index.js
```

**You should see:**
```
✅ Server is running on port 5000
✅ Database connected
✅ All services initialized
```

> Keep this terminal open. Leave it running in the background.

---

## Step 2️⃣: Install Admin Dependencies

**Open a NEW terminal and run:**

```bash
cd admin
npm install
```

> This will take a few minutes to download packages. Only needs to run once.

---

## Step 3️⃣: Start the Admin Dashboard

**In the same terminal (still in the admin folder), run:**

```bash
npm run dev
```

**You should see:**
```
✅ Local:        http://localhost:3000
✅ Ready in 2.5s
```

---

## Step 4️⃣: Open Your Browser

**Go to:**
```
http://localhost:3000
```

✨ **You're done!** Your admin dashboard is now running!

---

## 📊 What's Running Now

### Terminal 1 (Backend)
```
Port: 5000
URL: http://localhost:5000
Status: Backend API Server
```

### Terminal 2 (Admin Dashboard)
```
Port: 3000
URL: http://localhost:3000
Status: Admin Dashboard
```

### How They Communicate
```
Admin Dashboard → Backend API
  (localhost:3000)   (localhost:5000)
        ↓
   Makes API calls
        ↓
  Backend processes
        ↓
  Returns data to admin
```

---

## ✨ What You Can Do

In the admin dashboard you can:

- 👥 **Users**: View, manage, block/unblock all users
- 🏢 **Providers**: Approve pending providers, view ratings
- 📅 **Bookings**: Track all service bookings
- 💰 **Withdrawals**: Approve/reject provider cash withdrawals
- 🏷️ **Categories**: Manage service categories
- 📢 **Offers & Banners**: Create promotional content
- 📊 **Analytics**: View platform statistics
- 💬 **Support**: Manage customer support chats
- ⚙️ **Settings**: Configure platform settings

---

## 🛑 To Stop Everything

**To stop the backend:**
- Press `Ctrl + C` in Terminal 1

**To stop the admin dashboard:**
- Press `Ctrl + C` in Terminal 2

---

## 📝 Documentation

For more detailed information:

| Document | Purpose |
|----------|---------|
| **ADMIN_QUICK_START.md** | Quick reference guide |
| **ADMIN_SETUP.md** | Detailed setup instructions |
| **ADMIN_VERIFICATION.md** | Integration checklist |
| **ADMIN_INTEGRATION_SUMMARY.md** | What was done |

---

## ⚡ Quick Reference

### If Port 3000 is Already Used
```bash
npm run dev -- -p 3001
# Admin runs on http://localhost:3001
```

### To Check if Services are Running

**Backend:**
```bash
curl http://localhost:5000/
```

**Admin:**
```
Open http://localhost:3000 in browser
```

### Environment Configuration
- Backend URL: `http://localhost:5000`
- Admin URL: `http://localhost:3000`
- Configuration file: `/admin/.env.local`

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Port 5000 already in use" | Close other apps using port 5000 or change the port in `index.js` |
| "Port 3000 already in use" | Use `npm run dev -- -p 3001` for different port |
| "Cannot connect to backend" | Verify backend is running: `node index.js` in Terminal 1 |
| "Admin won't load" | Check browser console (F12) for errors |
| "npm install fails" | Try deleting `node_modules` and running again |

---

## 🌟 Next Steps

1. ✅ Get backend running
2. ✅ Get admin dashboard running
3. ✅ Log in to admin dashboard
4. ✅ Start managing your platform
5. ✅ Check documentation for production deployment

---

## 📞 Need Help?

1. **Check the backend logs** - See if there are any errors
2. **Check browser console** - Press F12 in the browser
3. **Read the guides** - Check ADMIN_SETUP.md for detailed help
4. **Verify connections** - Make sure both services are running

---

## 🎉 You're All Set!

Your Madadwala platform is ready to use. 

**Happy building!** 🚀

---

### Command Summary

```bash
# Terminal 1 - Start Backend
node index.js

# Terminal 2 - Start Admin Dashboard
cd admin
npm install      # Only first time
npm run dev      # Every time after
```

Then open: **http://localhost:3000**
