'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, BarChart3, Users, Briefcase, Calendar, CreditCard, Tag, Image, Settings, LogOut, Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  const navigationItems = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Providers', href: '/admin/providers', icon: Briefcase },
    { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: CreditCard },
    { name: 'Categories', href: '/admin/categories', icon: Tag },
    { name: 'Offers & Banners', href: '/admin/offers-banners', icon: Image },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Commissions', href: '/admin/commissions', icon: CreditCard },
    { name: 'Coupons', href: '/admin/coupons', icon: Tag },
    { name: 'Activity Logs', href: '/admin/activity-logs', icon: BarChart3 },
    { name: 'Support', href: '/admin/support', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 flex flex-col fixed left-0 top-0 h-full z-40`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center font-bold">
              MA
            </div>
            {sidebarOpen && <span className="text-xl font-bold">Madadwala</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`mx-2 px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-red-400 hover:bg-slate-700 w-full"
            onClick={() => {
              localStorage.removeItem('adminToken')
              window.location.href = '/'
            }}
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} flex-1 flex flex-col transition-all duration-300`}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-4 py-2 gap-2">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent outline-none text-sm w-48"
              />
            </div>
            <Button variant="ghost" size="sm" className="relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              AD
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
