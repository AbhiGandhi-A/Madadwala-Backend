# Madadwala Admin Dashboard Setup

## Overview
The admin dashboard is located in the `/admin` folder and is a Next.js application that connects to the Express backend in `index.js`.

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- Backend (Express server) running on `localhost:5000`

### 2. Install Dependencies

Navigate to the admin folder and install dependencies:

```bash
cd admin
npm install
# or
pnpm install
# or
yarn install
```

### 3. Environment Configuration

The `.env.local` file is already configured to connect to the local backend at `http://localhost:5000`.

To use a different backend URL (e.g., production), update the `.env.local` file:

```bash
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

### 4. Start the Admin Dashboard

From the admin folder:

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

The admin dashboard will be available at `http://localhost:3000`

### 5. Full Stack Development

To run both backend and admin dashboard together:

**Terminal 1 (Backend):**
```bash
# From the root directory
node index.js
# The backend runs on http://localhost:5000
```

**Terminal 2 (Admin Dashboard):**
```bash
# From the admin folder
npm run dev
# The admin dashboard runs on http://localhost:3000
```

## API Integration

The admin dashboard uses the API client in `admin/lib/api-client.ts` which handles all communication with the Express backend.

### Available Admin Endpoints

The following endpoints are available from the backend and used by the admin dashboard:

**Users:**
- `GET /api/users` - Get all users
- `GET /api/users/:uid` - Get user by ID
- `PATCH /api/users/:uid` - Update user
- `DELETE /api/users/:uid` - Delete user

**Providers:**
- `GET /api/providers` - Get all providers
- `GET /api/providers/:uid` - Get provider by ID
- `GET /api/admin/pending-providers` - Get pending provider approvals
- `POST /api/admin/approve-provider` - Approve a provider
- `GET /api/provider/performance/:uid` - Get provider performance stats

**Bookings:**
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking by ID
- `GET /api/bookings/customer/:uid` - Get bookings by customer
- `GET /api/bookings/provider/:uid` - Get bookings by provider
- `PATCH /api/bookings/:id` - Update booking

**Withdrawals:**
- `GET /api/admin/withdrawals/pending` - Get pending withdrawal requests
- `PATCH /api/admin/withdrawals/:id` - Approve or reject withdrawal

**Categories:**
- `GET /api/categories` - Get all categories
- `POST /api/admin/categories` - Create category
- `DELETE /api/admin/categories/:id` - Delete category

**Offers & Banners:**
- `GET /api/offers` - Get all offers
- `POST /api/admin/offers` - Create offer
- `DELETE /api/admin/offers/:id` - Delete offer
- `GET /api/banners` - Get all banners
- `POST /api/admin/banners` - Create banner (with image upload)
- `DELETE /api/admin/banners/:id` - Delete banner

**Analytics:**
- `GET /api/admin/analytics` - Get analytics data

**Support:**
- `GET /api/admin/support/chats` - Get support chats
- `GET /api/support/messages/:userId` - Get messages for a user
- `POST /api/support/messages` - Send support message

**Settings:**
- `GET /api/admin/settings` - Get admin settings
- `POST /api/admin/settings` - Update admin settings

**Active Jobs:**
- `GET /api/admin/active-jobs` - Get active jobs

## Important Notes

⚠️ **Do NOT modify `index.js`** - The backend server is already properly configured and should not be changed.

✅ **Backend is already set up** - All necessary API routes, database connections, and middleware are configured.

✅ **Admin dashboard is ready to use** - The frontend communicates with the backend through the `/api` routes configured in Express.

## Troubleshooting

### "Connection refused" errors
- Make sure the backend is running on `localhost:5000`
- Check that `NEXT_PUBLIC_BACKEND_URL` in `.env.local` is correct

### "CORS" errors
- CORS is already enabled on the backend
- Verify the backend is serving requests properly

### Missing data in admin dashboard
- Ensure the backend database is properly seeded with data
- Check backend logs for any errors
- Verify API endpoints are working with a tool like Postman or curl

### Admin dashboard won't start
- Run `npm install` again to ensure all dependencies are installed
- Check Node.js version (18+ required)
- Try deleting `.next` folder and running `npm run dev` again

## Production Deployment

For production deployment:

1. Update `NEXT_PUBLIC_BACKEND_URL` to your production backend URL
2. Build the admin dashboard: `npm run build`
3. Start: `npm start`
4. Deploy to Vercel or your preferred hosting platform

The admin dashboard and backend can be deployed separately - ensure the frontend can reach the backend API URL.
