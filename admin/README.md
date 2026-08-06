# Madadwala Admin Dashboard

A comprehensive Next.js admin panel for managing the Madadwala service platform. This admin dashboard provides complete control over users, providers, bookings, withdrawals, and more.

## Features

### 1. **Dashboard**
- Real-time analytics and platform metrics
- Total customers, verified providers, bookings count
- Revenue tracking
- Provider distribution by category
- Key performance indicators

### 2. **Users Management**
- View all customers and providers
- Search users by name, phone, or email
- Block/Unblock users
- Delete user accounts
- User verification status tracking
- User role management (customer, provider, admin)

### 3. **Providers Management**
- View all service providers
- Pending provider verification queue
- Approve/Reject new providers
- Manage verified providers
- Filter by verification status and availability
- View provider ratings, reviews, and performance

### 4. **Bookings Management**
- View all service bookings
- Real-time active jobs tracking
- Booking status monitoring (pending, accepted, in progress, completed, cancelled)
- Payment status tracking
- Search and filter bookings
- Service history

### 5. **Financial Management**
- **Withdrawals**: Process provider withdrawal requests
- **Transactions**: View all wallet transactions
- Approve/Reject withdrawal requests
- Track total revenue and earnings
- Transaction history with detailed logs

### 6. **Support Management**
- Admin support chat interface
- Real-time messaging with users
- Support ticket management
- Chat history and user conversations
- Support session tracking

### 7. **User Reports**
- View reported users/violations
- Report status tracking (pending, reviewed, resolved)
- Evidence management
- Action tracking for reported incidents
- Report details and descriptions

### 8. **Settings**
- Application configuration
- Support contact information
- Payment settings (min/max withdrawal, commission)
- Feature toggles (maintenance mode, registration controls)
- System information

## Project Structure

```
admin/
├── app/
│   ├── page.tsx                 # Dashboard
│   ├── layout.tsx              # Root layout
│   ├── layout-client.tsx       # Client layout with sidebar
│   ├── globals.css             # Global styles
│   ├── users/
│   │   ├── page.tsx            # All users
│   │   └── blocked/page.tsx    # Blocked users
│   ├── providers/
│   │   ├── page.tsx            # All providers
│   │   ├── pending/page.tsx    # Pending providers
│   │   ├── verified/page.tsx   # Verified providers
│   │   └── [uid]/page.tsx      # Provider details
│   ├── bookings/
│   │   ├── page.tsx            # All bookings
│   │   └── active/page.tsx     # Active jobs
│   ├── withdrawals/page.tsx    # Withdrawal requests
│   ├── transactions/page.tsx   # Transaction history
│   ├── support/page.tsx        # Support chat
│   ├── reports/page.tsx        # User reports
│   └── settings/page.tsx       # Settings
├── components/
│   ├── Dashboard.tsx           # Dashboard component
│   ├── Sidebar.tsx             # Navigation sidebar
│   └── Header.tsx              # Top header
├── lib/
│   └── api.ts                  # API utility functions
├── .env.local                  # Environment variables
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── next.config.js              # Next.js configuration
└── package.json
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Steps

1. **Navigate to admin directory**
```bash
cd admin
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

4. **Run development server**
```bash
npm run dev
```

The admin panel will be available at `http://localhost:3001`

## Build for Production

```bash
npm run build
npm start
```

## API Endpoints Used

The admin panel connects to these backend API endpoints:

### Analytics
- `GET /api/admin/analytics` - Platform statistics

### Users
- `GET /api/admin/users` - All users
- `GET /api/admin/users/:uid` - User details
- `DELETE /api/admin/users/:uid` - Delete user
- `PATCH /api/admin/users/:uid/block` - Block user
- `PATCH /api/admin/users/:uid/unblock` - Unblock user

### Providers
- `GET /api/admin/pending-providers` - Pending approvals
- `GET /api/admin/providers` - All providers
- `POST /api/admin/approve-provider` - Approve provider
- `POST /api/admin/reject-provider` - Reject provider

### Bookings
- `GET /api/admin/bookings` - All bookings
- `GET /api/admin/bookings/:id` - Booking details
- `GET /api/admin/active-jobs` - Active jobs
- `PATCH /api/admin/bookings/:id` - Update booking status

### Withdrawals
- `GET /api/admin/withdrawals/pending` - Pending withdrawals
- `PATCH /api/admin/withdrawals/:id` - Approve/Reject withdrawal

### Transactions
- `GET /wallet/transactions/:uid` - User transactions
- `GET /admin/transactions` - All transactions

### Support
- `GET /api/admin/support/chats` - Support chat list
- `GET /api/support/messages/:userId` - Chat messages
- `POST /api/support/messages` - Send message

### Reports
- `GET /api/admin/reports` - All reports
- `PATCH /api/admin/reports/:id` - Update report status

## Key Features Implemented

✅ **Real-time Data Fetching** - Using SWR for data caching and synchronization
✅ **Complete CRUD Operations** - Create, read, update, delete for all resources
✅ **Advanced Filtering** - Search and filter users, providers, bookings
✅ **Status Management** - Track statuses for withdrawals, bookings, reports
✅ **Financial Tracking** - Monitor revenue, transactions, and withdrawals
✅ **User Support** - Built-in chat system for admin-user communication
✅ **Responsive Design** - Works on desktop, tablet, and mobile devices
✅ **Professional UI** - Clean, modern interface with Tailwind CSS
✅ **Real Data** - No mock data - all data comes from live backend API
✅ **Error Handling** - Proper error messages and user feedback

## Technologies Used

- **Next.js 16** - React framework
- **React 19** - UI library
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **SWR** - Data fetching and caching
- **Recharts** - Data visualization
- **Lucide Icons** - Icon library

## Development Notes

1. The admin panel uses SWR for data fetching, which automatically handles caching, revalidation, and real-time updates
2. All API calls are configured in `lib/api.ts` for easy maintenance
3. Components are modular and reusable
4. Styling is done with Tailwind CSS utility classes
5. The sidebar is fully functional with nested menu items

## Future Enhancements

- Authentication and login system
- Admin role management
- Audit logs
- Advanced analytics and reports
- Email notifications
- SMS notifications
- Category management UI
- Banner management
- Offer management

## Backend Integration

This admin panel is designed to work with the Madadwala backend API. Ensure the backend is running on the configured API URL before using the admin panel.

Backend Repository: [Madadwala-Backend](https://github.com/AbhiGandhi-A/Madadwala-Backend)

## License

MIT License - All rights reserved Madadwala
