'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/providers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { getUnreadMessageCount } from '@/lib/api'
import { Mail, Home, LogOut, Plus, PlusCircle, Sun, Moon } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { getThemePreference, setThemePreference } from '@/lib/storage'

export function Header() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutCooldown, setSignOutCooldown] = useState(0)

  // Initialize theme from cookie on mount
  useEffect(() => {
    const savedTheme = getThemePreference()
    if (savedTheme && savedTheme !== theme) {
      setTheme(savedTheme)
    }
  }, [])

  // Save theme preference to cookie when it changes
  useEffect(() => {
    if (theme) {
      setThemePreference(theme)
    }
  }, [theme])

 const { data: unreadCount } = useQuery({
   queryKey: ['unread-messages', user?.id],
   queryFn: () => getUnreadMessageCount(user!.id),
   enabled: !!user,
 })

 // Cooldown timer for sign out
 useEffect(() => {
   let interval: NodeJS.Timeout
   if (signOutCooldown > 0) {
     interval = setInterval(() => {
       setSignOutCooldown(prev => prev - 1)
     }, 1000)
   }
   return () => {
     if (interval) clearInterval(interval)
   }
 }, [signOutCooldown])

  const handleSignOut = async () => {
    if (signOutCooldown > 0) {
      toast.error(`Please wait ${signOutCooldown} seconds before signing out again.`)
      return
    }

    setIsSigningOut(true)
    setSignOutCooldown(4) // Set 4 second cooldown

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        toast.error('Error signing out')
        setIsSigningOut(false)
        setSignOutCooldown(0)
      } else {
        toast.success('Signed out successfully')
        // Navigate immediately without extra delay
        router.push('/home')
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error)
      toast.error('Unexpected error during sign out')
      setIsSigningOut(false)
      setSignOutCooldown(0)
    }
  }

  return (
    <>
      <header className="border-b bg-white dark:bg-gray-900 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" onClick={() => window.location.href = '/home'} className="flex items-center gap-2 md:gap-3 text-lg md:text-2xl font-bold text-black dark:text-white hover:text-black dark:hover:text-white transition-colors flex-shrink-0">
            <img src="/icons/prodavajbrzoicon.png" alt="ProdavajBrzo Logo" className="h-6 w-6 md:h-10 md:w-10" />
            ProdavajBrzo
          </Link>


          <div className="flex items-center gap-1 md:gap-4 flex-shrink-0">
            {/* Theme Toggle */}
            <div className="flex items-center gap-3 mr-2 md:mr-4">
              {/* Sun icon (left of toggle) */}
              <Sun className={`h-5 w-5 transition-all duration-300 ${
                theme === 'dark' ? 'opacity-50 scale-90 text-yellow-500' : 'opacity-100 scale-100 text-yellow-600'
              }`} />

              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  theme === 'dark' ? 'bg-orange-500' : 'bg-gray-200'
                }`}
                aria-label="Toggle theme"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
                <span className="sr-only">Toggle theme</span>
              </button>

              {/* Moon icon (right of toggle) */}
              <Moon className={`h-5 w-5 transition-all duration-300 ${
                theme === 'dark' ? 'opacity-100 scale-100 text-white' : 'opacity-50 scale-90 text-gray-600'
              }`} />
            </div>

            {user ? (
              <>
                <Link href="/dashboard/new">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white text-xs md:text-sm px-2 md:px-4 hidden md:flex">
                    <PlusCircle className="h-4 w-4 md:mr-1" />
                    <span className="hidden md:inline">Add</span>
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button variant="outline" size="sm" className="border-2 hover:border-orange-500 text-xs md:text-sm px-2 md:px-4 relative">
                    <Mail className="h-4 w-4 md:mr-1" />
                    <span className="hidden md:inline">Messages</span>
                    <span className={`absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full ${
                      unreadCount && unreadCount > 0 ? 'bg-red-500 text-white' : 'bg-gray-400 text-white'
                    }`}>
                      {unreadCount && unreadCount > 99 ? '99+' : (unreadCount || 0)}
                    </span>
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="border-2 hover:border-orange-500 text-xs md:text-sm px-2 md:px-4">
                    <Home className="h-4 w-4 md:mr-1" />
                    <span className="hidden md:inline">Dashboard</span>
                  </Button>
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  disabled={isSigningOut || signOutCooldown > 0}
                  className={`border-2 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors text-xs md:text-sm px-2 md:px-4 ${
                    isSigningOut || signOutCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSigningOut ? (
                    <div className="loading-spinner h-4 w-4 md:mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 md:mr-1" />
                  )}
                  <span className="hidden md:inline">
                    {isSigningOut ? 'Signing Out...' : signOutCooldown > 0 ? `Wait ${signOutCooldown}s` : 'Sign Out'}
                  </span>
                </Button>
              </>
            ) : pathname !== '/auth' && (
              <Link href="/auth">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white text-xs md:text-sm px-2 md:px-4">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Floating Action Button for Mobile */}
      {user && (
        <Link href="/dashboard/new">
          <Button
            size="lg"
            className="md:hidden fixed bottom-6 left-6 z-50 bg-orange-600 hover:bg-orange-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      )}
    </>
  )
}