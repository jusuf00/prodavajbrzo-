'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/providers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { getUnreadMessageCount } from '@/lib/api'
import { Mail, Home, LogOut, Plus, PlusCircle } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export function Header() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutCooldown, setSignOutCooldown] = useState(0)

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

    // Add a small delay for smooth animation
    setTimeout(async () => {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error('Error signing out')
        setIsSigningOut(false)
        setSignOutCooldown(0) // Reset cooldown on error
      } else {
        toast.success('Signed out successfully')
        // Add another delay before navigation for better UX
        setTimeout(() => {
          router.push('/home')
        }, 500)
      }
    }, 300)
  }

  return (
    <>
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" onClick={() => window.location.href = '/home'} className="flex items-center gap-2 md:gap-3 text-lg md:text-2xl font-bold text-black hover:text-black transition-colors flex-shrink-0">
            <img src="/icons/prodavajbrzoicon.png" alt="ProdavajBrzo Logo" className="h-6 w-6 md:h-10 md:w-10" />
            ProdavajBrzo
          </Link>

          <div className="flex items-center gap-1 md:gap-4 flex-shrink-0">
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