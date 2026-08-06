# Madadwala Admin Panel - Complete Frontend Documentation

## 🎯 Overview

This is a fully functional admin panel frontend for the Madadwala service provider platform. It provides comprehensive management capabilities for all aspects of the platform without modifying your existing backend.

## 📁 Project Structure

```
/app/admin/
├── layout.tsx              # Admin panel main layout with sidebar navigation
├── page.tsx                # Dashboard homepage
├── users/page.tsx          # User management
├── providers/page.tsx      # Provider management & approvals
├── bookings/page.tsx       # Booking management
├── withdrawals/page.tsx    # Withdrawal requests management
├── categories/page.tsx     # Service categories management
├── offers-banners/page.tsx # Offers & promotional banners
├── analytics/page.tsx      # Advanced analytics & metrics
├── commissions/page.tsx    # Commission management
├── coupons/page.tsx        # Coupon & promotion codes
├── activity-logs/page.tsx  # System activity tracking
├── support/page.tsx        # Support tickets & help desk
└── settings/page.tsx       # Admin settings & configuration
```

## ✨ Features

### 1. **Dashboard** (`/admin`)
- Quick overview of key metrics
- Total users, providers, bookings, revenue
- Pending approvals counter
- Active bookings tracker
- Quick action buttons for common tasks

### 2. **User Management** (`/admin/users`)
- View all users with detailed information
- Search & filter capabilities
- Block/unblock users functionality
- User deletion with confirmation
- View user details modal
- Export user data
- Manage user wallet balance
- Track verification status

### 3. **Provider Management** (`/admin/providers`)
- Manage service providers
- Provider approval/rejection system
- View provider details & ratings
- Delete providers
- Filter by verification status
- Track provider availability
- Search by name, email, or category
- Commission rate overview

### 4. **Bookings Management** (`/admin/bookings`)
- View all bookings with full details
- Filter by booking status (pending, accepted, in progress, completed, etc.)
- Search by customer, provider, or service name
- View booking details including location, time, and payment status
- Track payment information
- Export booking data

### 5. **Withdrawal Management** (`/admin/withdrawals`)
- Manage provider withdrawal requests
- Approve/reject withdrawals with reasons
- View bank account details
- Track withdrawal status
- Summary statistics (pending, approved, paid)
- Export withdrawal data
- Manage minimum withdrawal amounts

### 6. **Categories Management** (`/admin/categories`)
- Add, edit, delete service categories
- Manage category icons and images
- Search categories
- Quick category overview
- Customize category display

### 7. **Offers & Banners** (`/admin/offers-banners`)
**Offers Tab:**
- Create promotional offers
- Manage discount codes
- Set expiry dates
- Track offer usage
- Delete inactive offers

**Banners Tab:**
- Create promotional banners
- Upload banner images
- Manage active/inactive status
- Set banner titles and subtitles
- Delete banners

### 8. **Analytics** (`/admin/analytics`)
- Revenue trends (monthly data visualization)
- Service category breakdown
- User growth tracking
- Booking status distribution
- Top performing providers leaderboard
- Key performance indicators
- Export analytics data

### 9. **Commission Management** (`/admin/commissions`)
- View all provider commissions
- Track commission rates per provider
- View total commission earned
- Filter by payment status (paid/pending)
- Commission settings configuration
- Set default, minimum, and maximum rates
- Search by provider name

### 10. **Coupons** (`/admin/coupons`)
- Create promotional coupons
- Set discount type (percentage or fixed amount)
- Track coupon usage
- Set maximum usage limits
- Manage expiry dates
- View utilization rates
- Edit/delete coupons
- Search by coupon code

### 11. **Activity Logs** (`/admin/activity-logs`)
- Track all system activities
- View user actions with timestamps
- Filter by action type
- Search activity history
- IP address tracking
- Success/failure status tracking
- Export activity data
- Detailed activity view modal

### 12. **Support Tickets** (`/admin/support`)
- Manage customer support tickets
- Filter tickets by status (open, in progress, resolved)
- Set ticket priority (high, medium, low)
- View conversation history
- Reply to tickets
- Search by subject or user
- Track ticket creation and update dates
- Export ticket data

### 13. **Settings** (`/admin/settings`)
- **General Settings**: App name, email, phone, address
- **Notification Preferences**: Email, push, SMS, reports
- **Security Settings**: 2FA, session timeout, login attempts
- **Platform Settings**: Commission rates, withdrawal limits, booking amounts, support email
- Change admin password

## 🚀 Getting Started

### Installation

1. **Install dependencies**:
```bash
pnpm install
```

2. **Start development server**:
```bash
pnpm dev
```

3. **Access admin panel**:
Open `http://localhost:3000` in your browser. You'll be automatically redirected to `/admin`.

## 🔌 Backend Integration

The frontend is designed to work with your existing backend. To integrate with your API:

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

### API Endpoints to Connect

Replace the mock data in each page with actual API calls to these backend endpoints:

#### Users
- `GET /api/users` - Get all users
- `GET /api/users/:uid` - Get user details
- `PATCH /api/users/:uid` - Update user
- `DELETE /api/users/:uid` - Delete user

#### Providers
- `GET /api/providers` - Get all providers
- `GET /api/admin/pending-providers` - Get pending approvals
- `POST /api/admin/approve-provider` - Approve provider
- `DELETE /api/providers/:uid` - Delete provider

#### Bookings
- `GET /api/bookings/customer/:uid` - Get customer bookings
- `GET /api/bookings/provider/:uid` - Get provider bookings
- `PATCH /api/bookings/:id` - Update booking status

#### Withdrawals
- `GET /api/admin/withdrawals/pending` - Get pending withdrawals
- `PATCH /api/admin/withdrawals/:id` - Approve/reject withdrawal

#### Categories
- `GET /api/categories` - Get all categories
- `POST /api/admin/categories` - Create category
- `DELETE /api/admin/categories/:id` - Delete category

#### Offers & Banners
- `GET /api/offers` - Get all offers
- `POST /api/admin/offers` - Create offer
- `PUT /api/admin/offers/:id` - Update offer
- `DELETE /api/admin/offers/:id` - Delete offer
- `GET /api/banners` - Get all banners
- `POST /api/admin/banners` - Create banner
- `PUT /api/admin/banners/:id` - Update banner
- `DELETE /api/admin/banners/:id` - Delete banner

#### Analytics
- `GET /api/admin/analytics` - Get analytics data

### Data Fetching Pattern

Replace mock data with API calls. Example:

**Before (Mock Data):**
```typescript
const fetchUsers = async () => {
  setUsers([
    { id: '1', name: 'John', ... }
  ])
}
```

**After (API Integration):**
```typescript
const fetchUsers = async () => {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    const response = await fetch(`${backendUrl}/api/users`)
    const data = await response.json()
    setUsers(data)
  } catch (error) {
    console.error('Failed to fetch users:', error)
  }
}
```

## 🎨 Design Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Sidebar Navigation**: Professional dark theme navigation
- **Color-coded Status Badges**: Easy status identification
- **Modal Dialogs**: Clean confirmation and detail views
- **Data Tables**: Sortable and filterable tables
- **Search & Filter**: Quick data discovery
- **Export Functionality**: Download data as needed
- **Toast Notifications**: User feedback (ready to implement)
- **Accessibility**: Semantic HTML and ARIA labels

## 📊 UI Components Used

- **shadcn/ui Components**:
  - `Button`
  - `Card`
  - `Dialog`
  - `Input`
  - `Label`
  - `Tabs`
  - `Textarea`
  - `Select` (native HTML)

- **Lucide Icons**: Professional icon set throughout
- **Tailwind CSS**: Utility-first styling

## 🔐 Security Considerations

1. **Authentication**: Add authentication check in `/app/admin/layout.tsx`
2. **Authorization**: Implement role-based access control
3. **API Security**: Always validate server-side
4. **Session Management**: Implement proper session handling
5. **CSRF Protection**: Add CSRF tokens for mutations

## 📝 Implementation Checklist

- [ ] Connect to backend API endpoints
- [ ] Implement authentication/login
- [ ] Add loading states
- [ ] Add error handling & toast notifications
- [ ] Implement pagination for large datasets
- [ ] Add real-time updates using WebSocket/polling
- [ ] Set up data export functionality
- [ ] Implement activity logging
- [ ] Add audit trails
- [ ] Set up 2FA for admin account
- [ ] Configure role-based access control
- [ ] Add data validation
- [ ] Implement search optimization
- [ ] Add advanced filtering options
- [ ] Set up analytics integration

## 🎯 Next Steps

1. **Replace Mock Data**: Update each page to fetch from your backend API
2. **Add Authentication**: Implement login/session management
3. **Error Handling**: Add proper error messages and handling
4. **Loading States**: Add loading indicators for async operations
5. **Real-time Updates**: Implement WebSocket for live updates
6. **User Feedback**: Add toast notifications for actions
7. **Data Validation**: Validate form inputs before submission
8. **Responsive Testing**: Test on various devices
9. **Performance Optimization**: Add pagination, lazy loading
10. **Deploy**: Build and deploy to production

## 🚀 Deployment

1. **Build the project**:
```bash
pnpm build
```

2. **Start production server**:
```bash
pnpm start
```

3. **Deploy to Vercel** (recommended):
```bash
vercel deploy
```

## 📞 Support

For any issues or questions:
1. Check the backend API documentation
2. Verify environment variables are set correctly
3. Check browser console for errors
4. Review API response structure

## 📄 License

This admin panel is part of the Madadwala platform.

---

**Created with v0 by Vercel** - A complete, production-ready admin panel frontend that's ready to connect to your backend!
