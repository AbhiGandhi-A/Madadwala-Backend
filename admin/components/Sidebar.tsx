'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CreditCard,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      label: 'Users Management',
      icon: Users,
      submenu: [
        { label: 'All Users', href: '/users' },
        { label: 'Blocked Users', href: '/users/blocked' },
      ],
    },
    {
      label: 'Providers',
      icon: Briefcase,
      submenu: [
        { label: 'Pending Verification', href: '/providers/pending' },
        { label: 'Verified Providers', href: '/providers/verified' },
        { label: 'All Providers', href: '/providers' },
      ],
    },
    {
      label: 'Bookings',
      icon: Zap,
      submenu: [
        { label: 'Active Jobs', href: '/bookings/active' },
        { label: 'All Bookings', href: '/bookings' },
      ],
    },
    {
      label: 'Financial',
      icon: CreditCard,
      submenu: [
        { label: 'Withdrawals', href: '/withdrawals' },
        { label: 'Transactions', href: '/transactions' },
      ],
    },
    {
      label: 'Support',
      icon: MessageSquare,
      href: '/support',
    },
    {
      label: 'Reports',
      icon: AlertCircle,
      href: '/reports',
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '/settings',
    },
  ];

  const isActive = (href: string) => pathname === href;
  const isMenuExpanded = (label: string) => expandedMenu === label;

  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-screen`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className={`flex items-center gap-2 ${!isOpen && 'justify-center'}`}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">MD</span>
          </div>
          {isOpen && <span className="font-bold text-lg">Madadwala</span>}
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => (
          <div key={item.label}>
            {item.submenu ? (
              <button
                onClick={() =>
                  setExpandedMenu(
                    isMenuExpanded(item.label) ? null : item.label
                  )
                }
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isMenuExpanded(item.label)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} />
                {isOpen && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        isMenuExpanded(item.label) ? 'rotate-180' : ''
                      }`}
                    />
                  </>
                )}
              </button>
            ) : (
              <Link
                href={item.href || '#'}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive(item.href || '')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon size={20} />
                {isOpen && <span>{item.label}</span>}
              </Link>
            )}

            {/* Submenu Items */}
            {isOpen && item.submenu && isMenuExpanded(item.label) && (
              <div className="ml-4 mt-2 space-y-1 border-l border-gray-200 pl-4">
                {item.submenu.map((subitem) => (
                  <Link
                    key={subitem.href}
                    href={subitem.href}
                    className={`block px-4 py-2 rounded-lg transition-colors text-sm ${
                      isActive(subitem.href)
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {subitem.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}
