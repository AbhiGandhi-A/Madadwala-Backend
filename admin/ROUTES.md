# Madadwala Admin Panel - Routes Documentation

## Available Routes

### Dashboard
- **`/`** - Main dashboard with analytics and overview

### Users Management
- **`/users`** - All users (customers & providers)
- **`/users/blocked`** - Blocked/restricted users

### Providers Management
- **`/providers`** - All service providers
- **`/providers/pending`** - Pending provider approvals
- **`/providers/verified`** - Verified and active providers
- **`/providers/:uid`** - Individual provider details page

### Bookings & Jobs
- **`/bookings`** - All service bookings and orders
- **`/bookings/active`** - Real-time active jobs and ongoing services

### Financial Management
- **`/withdrawals`** - Manage provider withdrawal requests
- **`/transactions`** - View all wallet transactions and movements

### Support & Communication
- **`/support`** - Admin support chat and messaging
- **`/reports`** - User reports and violation management

### Administration
- **`/settings`** - Platform configuration and settings

## How to Access

### Development Mode
Start the dev server:
```bash
cd admin
npm run dev
```

Then access routes at: `http://localhost:3001/route-name`

### Examples
- Dashboard: `http://localhost:3001/`
- All Users: `http://localhost:3001/users`
- Pending Providers: `http://localhost:3001/providers/pending`
- Active Jobs: `http://localhost:3001/bookings/active`
- Withdrawals: `http://localhost:3001/withdrawals`
- Support Chat: `http://localhost:3001/support`

## Route Features

### 1. Dashboard (`/`)
**Features:**
- Real-time platform statistics
- Customer count, provider count, booking count
- Total revenue tracking
- Provider distribution by category
- Platform metrics and KPIs

### 2. Users (`/users`)
**Features:**
- Search users by name, phone, email
- View user roles (customer, provider, admin)
- Block/Unblock users
- Delete user accounts
- Verification status tracking
- Profile images and details

### 3. Pending Providers (`/providers/pending`)
**Features:**
- View new provider applications
- Provider details (name, category, phone, email)
- Aadhaar verification documents
- Approve provider button
- Reject provider button
- View full details link

### 4. All Providers (`/providers`)
**Features:**
- Search and filter providers
- Filter by: All, Verified, Unverified, Online
- Provider ratings and reviews count
- Starting prices
- Availability status
- Total jobs completed
- View individual provider profile

### 5. Active Jobs (`/bookings/active`)
**Features:**
- Real-time job status updates
- Auto-refresh every 5 seconds
- Job status filters (accepted, on_the_way, arrived, in_progress)
- Customer and provider names
- Service details
- Amount and payment status
- Location and scheduled time

### 6. All Bookings (`/bookings`)
**Features:**
- Search bookings by customer, provider, service
- Filter by status and payment status
- Booking history
- Complete booking details
- OTP tracking
- Comments and notes

### 7. Withdrawals (`/withdrawals`)
**Features:**
- List of pending withdrawal requests
- Provider bank details
- Withdrawal amount and status
- Approve withdrawal button
- Reject withdrawal with reason
- Total pending amount
- Statistics

### 8. Transactions (`/transactions`)
**Features:**
- All wallet transactions
- Credit and debit tracking
- Transaction titles and descriptions
- User ID filtering
- Date filtering
- Total credits and debits

### 9. Support Chat (`/support`)
**Features:**
- List of active support conversations
- Real-time messaging
- Unread message count
- Last message preview
- Send message functionality
- Chat timestamp tracking

### 10. Reports (`/reports`)
**Features:**
- User violation reports
- Report status (pending, reviewed, resolved)
- Reporter and reported user information
- Evidence URLs
- Report descriptions
- Status update actions
- Report details modal

### 11. Settings (`/settings`)
**Features:**
- Application configuration
- Support email and phone
- Withdrawal amount limits
- Platform commission settings
- Feature toggles:
  - Maintenance mode
  - New user registration
  - Provider registration
- System information

## API Integration

All routes fetch real data from the backend API endpoints:

| Route | API Endpoint |
|-------|---|
| Dashboard | `/api/admin/analytics` |
| Users | `/api/admin/users` |
| Providers | `/api/admin/pending-providers`, `/api/admin/providers` |
| Bookings | `/api/admin/bookings`, `/api/admin/active-jobs` |
| Withdrawals | `/api/admin/withdrawals/pending` |
| Transactions | `/api/wallet/transactions/:uid`, `/api/admin/transactions` |
| Support | `/api/admin/support/chats`, `/api/support/messages/:userId` |
| Reports | `/api/admin/reports` |

## Key Features Across All Routes

✅ **Real-time Data** - Live updates using SWR
✅ **Search & Filter** - Find data quickly
✅ **Responsive Design** - Works on all devices
✅ **Action Buttons** - Approve, reject, block, delete operations
✅ **Statistics** - Cards showing key metrics
✅ **Error Handling** - User-friendly error messages
✅ **Loading States** - Loading indicators for better UX
✅ **Modal Dialogs** - Detailed views and confirmations

## Navigation

Use the sidebar to navigate between routes. The sidebar includes:
- Active page highlighting
- Nested menu items (click to expand)
- Collapsible menu for compact view
- All main admin functions organized by category

## Environment Variables

Configure these in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

Adjust the URLs based on your backend server location.
