# Deployment Guide - Madadwala Admin Panel

## Backend Configuration

Your admin panel is configured to connect to the Vercel backend at:
```
https://madadwala-backend.vercel.app
```

### Environment Setup

The frontend automatically uses the Vercel backend. No additional configuration needed locally.

#### For Local Development

Create a `.env.local` file with:
```
NEXT_PUBLIC_BACKEND_URL=https://madadwala-backend.vercel.app
```

#### For Production

The `.env.local` file is already configured. Simply deploy to Vercel.

## Local Development

### Prerequisites
- Node.js 18+ installed
- pnpm package manager

### Setup Steps

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start development server:**
   ```bash
   pnpm dev
   ```

3. **Access the admin panel:**
   ```
   http://localhost:3000/admin
   ```

The frontend will automatically connect to the Vercel backend.

## Production Deployment

### Deploy to Vercel

1. **Connect your GitHub repository to Vercel**

2. **Set environment variables in Vercel:**
   ```
   NEXT_PUBLIC_BACKEND_URL=https://madadwala-backend.vercel.app
   ```

3. **Deploy:**
   ```bash
   vercel deploy --prod
   ```

### Alternative Hosting

For other hosting providers (AWS, Azure, etc.), ensure:
- Environment variable `NEXT_PUBLIC_BACKEND_URL` is set to `https://madadwala-backend.vercel.app`
- Next.js build command: `pnpm build`
- Start command: `pnpm start`

## API Integration

All API calls are configured in `/lib/api-client.ts` and automatically use the environment URL.

### Available Endpoints

The backend provides these endpoints (see API_QUICK_REFERENCE.md for details):

**Users:**
- `GET /api/users` - Fetch all users
- `PATCH /api/users/:uid` - Update user
- `DELETE /api/users/:uid` - Delete user

**Providers:**
- `GET /api/providers` - Fetch all providers
- `GET /api/admin/pending-providers` - Pending approvals
- `POST /api/admin/approve-provider` - Approve provider

**Bookings:**
- `GET /api/bookings` - Fetch all bookings
- `PATCH /api/bookings/:id` - Update booking status

**Withdrawals:**
- `GET /api/admin/withdrawals/pending` - Pending withdrawals
- `PATCH /api/admin/withdrawals/:id` - Approve/Reject

**Categories:**
- `GET /api/categories` - Fetch all categories
- `POST /api/admin/categories` - Create category
- `DELETE /api/admin/categories/:id` - Delete category

**Analytics:**
- `GET /api/admin/analytics` - Get analytics data

**Support:**
- `GET /api/admin/support/chats` - Fetch support chats
- `POST /api/support/messages` - Send message

## Troubleshooting

### Backend Connection Issues

1. **Check if backend is accessible:**
   ```bash
   curl https://madadwala-backend.vercel.app
   ```

2. **Verify environment variable:**
   - In Vercel dashboard: Settings → Environment Variables
   - Ensure `NEXT_PUBLIC_BACKEND_URL` is correctly set

3. **Check browser console:**
   - Open DevTools (F12)
   - Look for `[v0]` prefixed logs
   - These show API calls and responses

### CORS Issues

If you see CORS errors:
1. Ensure the backend allows requests from your frontend domain
2. Contact backend team to add your domain to CORS whitelist

### No Data Showing

1. Check if backend is running and accessible
2. Open DevTools console and look for API errors
3. Verify the backend URL is correct in `.env.local`

## Monitoring

### Application Performance

Monitor your deployment at:
- Vercel Dashboard: https://vercel.com/dashboard
- Real-time logs and analytics

### Error Tracking

Set up error tracking with:
- Vercel Analytics
- Sentry (optional)
- Custom monitoring

## Updates & Maintenance

### Update Next.js
```bash
pnpm add next@latest
pnpm install
```

### Update Dependencies
```bash
pnpm update
```

### Build for Production
```bash
pnpm build
pnpm start
```

## Security Best Practices

1. **Never commit `.env.local` to git**
   - Add to `.gitignore` (already done)

2. **Use HTTPS always**
   - All connections to backend are HTTPS

3. **Secure sensitive data**
   - Don't expose API keys in frontend code
   - Keep tokens in secure HTTP-only cookies

4. **Monitor for vulnerabilities**
   - Run `pnpm audit`
   - Keep dependencies updated

## Support

For issues or questions:
1. Check the console logs (search for `[v0]`)
2. Review API_QUICK_REFERENCE.md
3. Check REAL_DATA_INTEGRATION.md for integration details
4. Contact the development team

---

**Last Updated:** 2026-08-06
**Backend:** https://madadwala-backend.vercel.app
