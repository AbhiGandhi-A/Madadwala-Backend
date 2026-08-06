# API Integration Updates

This file documents the API integrations needed for the remaining pages:

## Offers & Banners Page
- Import: `import { offersApi, bannersApi } from '@/lib/api-client'`
- fetchOffers: Use `offersApi.getAll()`
- fetchBanners: Use `bannersApi.getAll()`
- Add offer: Use `offersApi.create(formData)`
- Edit offer: Use `offersApi.update(id, formData)`
- Delete offer: Use `offersApi.delete(id)`
- Add banner: Use `bannersApi.create(formData)` (FormData required)
- Edit banner: Use `bannersApi.update(id, formData)` (FormData required)
- Delete banner: Use `bannersApi.delete(id)`

## Analytics Page
- Import: `import { analyticsApi } from '@/lib/api-client'`
- fetchAnalytics: Use `analyticsApi.getAll()`
- Get real metrics from backend

## Commissions Page
- Import: `import { transactionsApi } from '@/lib/api-client'`
- Get commission data from backend transactions

## Coupons Page
- Create mock implementation (no backend endpoint for coupons yet)
- Can be added as future feature

## Activity Logs Page
- Import: `import { usersApi } from '@/lib/api-client'`
- Track user actions and system events

## Support Page
- Import: `import { supportApi } from '@/lib/api-client'`
- fetchChats: Use `supportApi.getChats()`
- Send message: Use `supportApi.sendMessage(userId, message)`
- Update status: Use `supportApi.updateStatus(userId, status)`
