# API Quick Reference Guide

## Quick Copy-Paste Integration Examples

### 1. Basic API Fetch Pattern

```typescript
const fetchData = async () => {
  try {
    setLoading(true)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    const response = await fetch(`${backendUrl}/api/endpoint`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) throw new Error('API Error')
    const data = await response.json()
    setData(data)
  } catch (error) {
    console.error('Error:', error)
    // Show error toast here
  } finally {
    setLoading(false)
  }
}
```

### 2. Users Module Integration

**Replace this in** `/app/admin/users/page.tsx`

```typescript
// GET Users
const fetchUsers = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const response = await fetch(`${backendUrl}/api/users`)
  const data = await response.json()
  setUsers(data)
}

// DELETE User
const handleDeleteUser = async (userId: string) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  await fetch(`${backendUrl}/api/users/${userId}`, {
    method: 'DELETE',
  })
  setUsers(users.filter(u => u.uid !== userId))
}

// PATCH User (Block)
const handleBlockUser = async (userId: string) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  await fetch(`${backendUrl}/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isBlocked: true }),
  })
}
```

### 3. Providers Module Integration

**Replace this in** `/app/admin/providers/page.tsx`

```typescript
// GET Pending Providers
const fetchProviders = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const response = await fetch(`${backendUrl}/api/admin/pending-providers`)
  const data = await response.json()
  setPendingProviders(data.map(p => p.uid))
}

// APPROVE Provider
const confirmApprove = async (providerId: string) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  await fetch(`${backendUrl}/api/admin/approve-provider`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerUid: providerId }),
  })
  setPendingProviders(pendingProviders.filter(id => id !== providerId))
}

// DELETE Provider
const handleDeleteProvider = async (providerId: string) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  await fetch(`${backendUrl}/api/providers/${providerId}`, {
    method: 'DELETE',
  })
}
```

### 4. Bookings Module Integration

**Replace this in** `/app/admin/bookings/page.tsx`

```typescript
// GET Bookings
const fetchBookings = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const response = await fetch(`${backendUrl}/api/bookings`)
  const data = await response.json()
  setBookings(data)
}

// UPDATE Booking Status
const updateBookingStatus = async (bookingId: string, status: string) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  await fetch(`${backendUrl}/api/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}
```

### 5. Withdrawals Module Integration

**Replace this in** `/app/admin/withdrawals/page.tsx`

```typescript
// GET Pending Withdrawals
const fetchWithdrawals = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const response = await fetch(`${backendUrl}/api/admin/withdrawals/pending`)
  const data = await response.json()
  setWithdrawals(data)
}

// APPROVE Withdrawal
const confirmApprove = async (withdrawalId: string) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  await fetch(`${backendUrl}/api/admin/withdrawals/${withdrawalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' }),
  })
}

// REJECT Withdrawal
const confirmReject = async (withdrawalId: string, reason: string) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  await fetch(`${backendUrl}/api/admin/withdrawals/${withdrawalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'rejected', rejectionReason: reason }),
  })
}
```

### 6. Categories Module Integration

**Replace this in** `/app/admin/categories/page.tsx`

```typescript
// GET Categories
const fetchCategories = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const response = await fetch(`${backendUrl}/api/categories`)
  const data = await response.json()
  setCategories(data)
}

// POST Category
const confirmAdd = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const response = await fetch(`${backendUrl}/api/admin/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  })
  const newCategory = await response.json()
  setCategories([...categories, newCategory])
}

// DELETE Category
const confirmDelete = async (categoryId: string) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  await fetch(`${backendUrl}/api/admin/categories/${categoryId}`, {
    method: 'DELETE',
  })
  setCategories(categories.filter(c => c._id !== categoryId))
}
```

### 7. Offers Module Integration

**Replace this in** `/app/admin/offers-banners/page.tsx` - Offers Tab

```typescript
// GET Offers
const fetchOffers = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const response = await fetch(`${backendUrl}/api/offers`)
  const data = await response.json()
  setOffers(data)
}

// POST Offer
const confirmAddOffer = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const response = await fetch(`${backendUrl}/api/admin/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(offerFormData),
  })
  const newOffer = await response.json()
  setOffers([...offers, newOffer])
}

// PUT Offer
const confirmEditOffer = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  await fetch(`${backendUrl}/api/admin/offers/${selectedOffer._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(offerFormData),
  })
}

// DELETE Offer
const confirmDeleteOffer = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  await fetch(`${backendUrl}/api/admin/offers/${selectedOffer._id}`, {
    method: 'DELETE',
  })
  setOffers(offers.filter(o => o._id !== selectedOffer._id))
}
```

### 8. Banners Module Integration

**Replace this in** `/app/admin/offers-banners/page.tsx` - Banners Tab

```typescript
// GET Banners
const fetchBanners = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const response = await fetch(`${backendUrl}/api/banners`)
  const data = await response.json()
  setBanners(data)
}

// POST Banner (with image upload)
const confirmAddBanner = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const formData = new FormData()
  formData.append('title', bannerFormData.title)
  formData.append('subtitle', bannerFormData.subtitle)
  formData.append('isActive', bannerFormData.isActive)
  // If image file: formData.append('image', imageFile)
  
  const response = await fetch(`${backendUrl}/api/admin/banners`, {
    method: 'POST',
    body: formData,
  })
  const newBanner = await response.json()
  setBanners([...banners, newBanner])
}

// PUT Banner
const confirmEditBanner = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const formData = new FormData()
  formData.append('title', bannerFormData.title)
  formData.append('subtitle', bannerFormData.subtitle)
  formData.append('isActive', bannerFormData.isActive)
  
  await fetch(`${backendUrl}/api/admin/banners/${selectedBanner._id}`, {
    method: 'PUT',
    body: formData,
  })
}

// DELETE Banner
const confirmDeleteBanner = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  await fetch(`${backendUrl}/api/admin/banners/${selectedBanner._id}`, {
    method: 'DELETE',
  })
  setBanners(banners.filter(b => b._id !== selectedBanner._id))
}
```

### 9. Analytics Module Integration

**Replace this in** `/app/admin/analytics/page.tsx`

```typescript
// GET Analytics Data
const fetchAnalytics = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
  const response = await fetch(`${backendUrl}/api/admin/analytics`)
  const data = await response.json()
  setStats({
    totalUsers: data.totalUsers,
    totalProviders: data.totalProviders,
    totalBookings: data.totalBookings,
    totalWithdrawals: data.totalWithdrawals,
    revenue: data.revenue,
    // ... other metrics
  })
}
```

### 10. Error Handling Template

```typescript
try {
  const response = await fetch(url, options)
  
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`)
  }
  
  const data = await response.json()
  return data
  
} catch (error) {
  if (error instanceof TypeError) {
    console.error('Network error:', error)
    // Show: "Network connection failed"
  } else {
    console.error('Error:', error)
    // Show: error.message
  }
  throw error
}
```

### 11. Loading States

```typescript
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const fetchData = async () => {
  try {
    setLoading(true)
    setError(null)
    // API call here
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error')
  } finally {
    setLoading(false)
  }
}

// In JSX
{loading && <div>Loading...</div>}
{error && <div className="text-red-600">{error}</div>}
{!loading && !error && data && <YourComponent data={data} />}
```

### 12. Search & Filter

```typescript
useEffect(() => {
  const filtered = data.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus
    return matchesSearch && matchesFilter
  })
  setFilteredData(filtered)
}, [searchTerm, filterStatus, data])
```

## Environment Setup

Create `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

For production:
```env
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

## Common Patterns

### POST Request
```typescript
fetch(`${backendUrl}/api/endpoint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
```

### PUT Request
```typescript
fetch(`${backendUrl}/api/endpoint/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
```

### PATCH Request
```typescript
fetch(`${backendUrl}/api/endpoint/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
```

### DELETE Request
```typescript
fetch(`${backendUrl}/api/endpoint/${id}`, {
  method: 'DELETE',
})
```

### File Upload
```typescript
const formData = new FormData()
formData.append('file', file)
formData.append('name', name)

fetch(`${backendUrl}/api/upload`, {
  method: 'POST',
  body: formData, // Don't set Content-Type header!
})
```

## Testing Checklist

- [ ] GET requests return data correctly
- [ ] POST requests create new items
- [ ] PUT/PATCH requests update items
- [ ] DELETE requests remove items
- [ ] Error handling shows messages
- [ ] Loading states display
- [ ] Success messages appear
- [ ] Search functionality works
- [ ] Filters work correctly
- [ ] Pagination works (if added)

---

**Use these templates to quickly integrate each module with your backend!**
