# Quick Start Guide - Madadwala Admin Dashboard

## Overview
Complete admin dashboard for managing the Madadwala service platform with full CRUD operations and real-time data synchronization.

## What's Included

✅ **Dashboard** - Analytics and overview  
✅ **User Management** - Block, delete, manage customers and providers  
✅ **Provider Verification** - Approve/reject new providers  
✅ **Booking Management** - Real-time active jobs tracking  
✅ **Withdrawal Processing** - Approve/reject provider payouts  
✅ **Transaction History** - All wallet movements  
✅ **Support Chat** - Direct messaging with users  
✅ **Report Management** - Handle user violations  
✅ **Settings** - Platform configuration  

## Getting Started

### 1. Installation

```bash
# Navigate to admin folder
cd admin

# Install dependencies
npm install

# Or if using yarn
yarn install
```

### 2. Configure Backend Connection

Create `.env.local` file in the admin directory:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

**Note:** Update the URLs if your backend runs on a different port or server.

### 3. Start Development Server

```bash
npm run dev
```

The admin dashboard will be available at: **http://localhost:3001**

## Main Features Overview

### 📊 Dashboard (`/`)
- Platform statistics and KPIs
- Revenue tracking
- Provider distribution charts
- Quick access buttons

### 👥 Users (`/users`)
- View all customers and providers
- Search by name, phone, email
- **Block users** - Restrict access
- **Delete users** - Remove accounts
- **Manage verification** - Track verified/unverified users

### ✅ Providers (`/providers/pending`)
- New provider applications queue
- **Approve providers** - Add to verified list
- **Reject providers** - Decline applications
- View provider credentials and documents

### 📱 Bookings (`/bookings`)
- All service bookings
- **Active jobs** - Real-time tracking
- Status management
- Payment tracking

### 💰 Financial (`/withdrawals` & `/transactions`)
- **Approve withdrawals** - Process payouts
- **Reject withdrawals** - Deny requests
- View transaction history
- Track platform revenue

### 💬 Support (`/support`)
- Real-time chat with users
- Message history
- Support ticket management

### 📋 Reports (`/reports`)
- User violation reports
- **Resolve reports** - Take action on violations
- Evidence viewing

### ⚙️ Settings (`/settings`)
- Configure platform settings
- Manage feature toggles
- Set withdrawal limits
- Support contact info

## Key Functionality

### Managing Users
1. Go to `/users`
2. Search for user
3. Click action buttons:
   - 🔒 **Lock icon** - Block user
   - 🗑️ **Trash icon** - Delete user

### Approving Providers
1. Navigate to `/providers/pending`
2. Review provider details
3. Click ✅ **Approve** button
4. Provider moves to verified list

### Processing Withdrawals
1. Go to `/withdrawals`
2. Review bank details and amount
3. Click ✅ **Approve** or ❌ **Reject**
4. If rejecting, provide reason
5. Funds transferred to provider or refunded

### Viewing Active Jobs
1. Visit `/bookings/active`
2. Auto-refreshes every 5 seconds
3. View real-time job status
4. Monitor customer-provider matches

### Support Chat
1. Navigate to `/support`
2. Select user from chat list
3. View message history
4. Send responses

## API Endpoints Connected

All data comes from real backend API:

```
✓ GET  /admin/analytics          - Dashboard stats
✓ GET  /admin/users              - User list
✓ GET  /admin/pending-providers  - Pending providers
✓ GET  /admin/bookings           - All bookings
✓ GET  /admin/active-jobs        - Active jobs
✓ GET  /admin/withdrawals/pending - Pending withdrawals
✓ GET  /admin/support/chats      - Support conversations
✓ POST /admin/approve-provider   - Approve provider
✓ PATCH /admin/withdrawals/:id   - Process withdrawal
✓ POST /support/messages         - Send support message
```

## Important Notes

### Backend Must Be Running
Ensure your Madadwala backend is running before accessing the admin panel.

```bash
# In backend directory
npm run dev
# Backend will run on http://localhost:5000
```

### No Mock Data
All data displayed is real data from the backend database. No placeholder or hardcoded data is used.

### Real Operations
Actions like approving providers, blocking users, and processing withdrawals actually modify the database.

## Troubleshooting

### "Cannot GET /api/admin/analytics"
**Solution:** Backend is not running. Start it with `npm run dev` in the backend directory.

### "API URL is incorrect"
**Solution:** Check `.env.local` file. Update `NEXT_PUBLIC_API_URL` to match your backend URL.

### "No data is showing"
**Solution:** 
1. Verify backend is running
2. Check `.env.local` configuration
3. Verify backend database has data
4. Check browser console for errors (F12)

## Build for Production

```bash
# Build optimized version
npm run build

# Start production server
npm start
```

## Project Structure

```
admin/
├── app/                      # Next.js app directory
│   ├── page.tsx             # Dashboard
│   ├── users/               # User management
│   ├── providers/           # Provider management
│   ├── bookings/            # Booking management
│   ├── withdrawals/         # Withdrawal management
│   ├── support/             # Support chat
│   ├── reports/             # Report management
│   └── settings/            # Settings
├── components/              # React components
│   ├── Dashboard.tsx
│   ├── Sidebar.tsx
│   └── Header.tsx
├── lib/
│   └── api.ts              # API client
├── .env.local              # Environment config
├── tailwind.config.js      # Tailwind config
├── next.config.js          # Next.js config
└── package.json
```

## Technologies

- **Next.js 16** - React framework
- **React 19** - UI library  
- **Tailwind CSS** - Styling
- **Axios** - HTTP requests
- **SWR** - Data fetching & caching
- **Recharts** - Charts & visualization
- **Lucide Icons** - Icons

## Features by Page

| Page | Features |
|------|----------|
| `/` | Dashboard, analytics, charts |
| `/users` | Search, block, delete users |
| `/users/blocked` | Unblock users |
| `/providers/pending` | Approve/reject providers |
| `/providers/verified` | View verified providers |
| `/providers` | All providers, filter, search |
| `/bookings` | All bookings, search, status |
| `/bookings/active` | Live job tracking |
| `/withdrawals` | Approve/reject payments |
| `/transactions` | Transaction history |
| `/support` | Real-time chat |
| `/reports` | Violation management |
| `/settings` | Platform configuration |

## Next Steps

1. ✅ Start the backend server
2. ✅ Configure `.env.local`
3. ✅ Run `npm run dev`
4. ✅ Open http://localhost:3001
5. ✅ Start managing your platform!

## Support

For issues or questions:
1. Check ROUTES.md for detailed route documentation
2. Check README.md for full feature documentation
3. Review backend API endpoints
4. Check browser console for error messages

Enjoy managing your Madadwala platform! 🚀
