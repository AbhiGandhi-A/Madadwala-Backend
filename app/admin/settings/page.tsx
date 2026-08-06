'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Bell, Lock, Users, CreditCard, Globe } from 'lucide-react'
const API_BASE = ''

export default function SettingsPage() {
  const [generalSettings, setGeneralSettings] = useState<any>({})
  const [notificationSettings, setNotificationSettings] = useState<any>({})
  const [securitySettings, setSecuritySettings] = useState<any>({})
  const [platformSettings, setPlatformSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const [generalResponse, notificationsResponse, securityResponse, platformResponse] = await Promise.all([
        fetch(`${API_BASE}/api/admin/settings/general`),
        fetch(`${API_BASE}/api/admin/settings/notifications`),
        fetch(`${API_BASE}/api/admin/settings/security`),
        fetch(`${API_BASE}/api/admin/settings/platform`),
      ])
      const general = generalResponse.ok ? await generalResponse.json() : {}
      const notifications = notificationsResponse.ok ? await notificationsResponse.json() : {}
      const security = securityResponse.ok ? await securityResponse.json() : {}
      const platform = platformResponse.ok ? await platformResponse.json() : {}
      setGeneralSettings(general)
      setNotificationSettings(notifications)
      setSecuritySettings(security)
      setPlatformSettings(platform)
    } catch (error) {
      console.error('[v0] Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      await Promise.all([
        fetch(`${API_BASE}/api/admin/settings/general`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(generalSettings) }),
        fetch(`${API_BASE}/api/admin/settings/notifications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(notificationSettings) }),
        fetch(`${API_BASE}/api/admin/settings/security`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(securitySettings) }),
        fetch(`${API_BASE}/api/admin/settings/platform`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(platformSettings) }),
      ])
      console.log('[v0] Settings saved')
    } catch (error) {
      console.error('[v0] Failed to save settings:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your admin panel and platform settings</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings size={18} />
            <span className="hidden md:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell size={18} />
            <span className="hidden md:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock size={18} />
            <span className="hidden md:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <Globe size={18} />
            <span className="hidden md:inline">Platform</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">General Settings</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">App Name</Label>
                <Input
                  value={generalSettings.appName}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, appName: e.target.value })
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-700">Email</Label>
                <Input
                  type="email"
                  value={generalSettings.email}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, email: e.target.value })
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-700">Phone</Label>
                <Input
                  value={generalSettings.phone}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, phone: e.target.value })
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-gray-700">Address</Label>
                <Input
                  value={generalSettings.address}
                  onChange={(e) =>
                    setGeneralSettings({ ...generalSettings, address: e.target.value })
                  }
                  className="mt-2"
                />
              </div>
              <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveSettings}>
                Save Changes
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications' },
                { key: 'pushNotifications', label: 'Push Notifications' },
                { key: 'smsNotifications', label: 'SMS Notifications' },
                { key: 'dailyReport', label: 'Daily Report' },
                { key: 'weeklyReport', label: 'Weekly Report' },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={setting.key}
                    checked={(notificationSettings as any)[setting.key]}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        [setting.key]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <Label htmlFor={setting.key} className="text-gray-700 cursor-pointer">
                    {setting.label}
                  </Label>
                </div>
              ))}
              <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white mt-4" onClick={handleSaveSettings}>
                Save Preferences
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="2fa"
                  checked={securitySettings.twoFactorAuth}
                  onChange={(e) =>
                    setSecuritySettings({ ...securitySettings, twoFactorAuth: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <Label htmlFor="2fa" className="text-gray-700 cursor-pointer">
                  Enable Two-Factor Authentication
                </Label>
              </div>

              <div>
                <Label className="text-gray-700">Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      sessionTimeout: parseInt(e.target.value),
                    })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-gray-700">Max Login Attempts</Label>
                <Input
                  type="number"
                  value={securitySettings.loginAttempts}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      loginAttempts: parseInt(e.target.value),
                    })
                  }
                  className="mt-2"
                />
              </div>

              <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white mt-4" onClick={handleSaveSettings}>
                Update Security
              </Button>
            </div>
          </Card>

          <Card className="p-6 border-red-200 bg-red-50">
            <h4 className="font-bold text-red-900 mb-4">Danger Zone</h4>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              Change Admin Password
            </Button>
          </Card>
        </TabsContent>

        {/* Platform Settings */}
        <TabsContent value="platform" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Platform Settings</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">Default Commission Rate (%)</Label>
                <Input
                  type="number"
                  value={platformSettings.commissionRate}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      commissionRate: parseInt(e.target.value),
                    })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-gray-700">Minimum Withdrawal Amount (₹)</Label>
                <Input
                  type="number"
                  value={platformSettings.minWithdrawal}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      minWithdrawal: parseInt(e.target.value),
                    })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-gray-700">Max Booking Amount (₹)</Label>
                <Input
                  type="number"
                  value={platformSettings.maxBookingAmount}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      maxBookingAmount: parseInt(e.target.value),
                    })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-gray-700">Support Email</Label>
                <Input
                  type="email"
                  value={platformSettings.supportEmail}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      supportEmail: e.target.value,
                    })
                  }
                  className="mt-2"
                />
              </div>

              <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white mt-4" onClick={handleSaveSettings}>
                Save Platform Settings
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
