'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/providers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { getUnreadMessageCount } from '@/lib/api'
import { Mail } from 'lucide-react'

export function Header() {
  const { user, loading } = useAuth()

 const { data: unreadCount } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: () => getUnreadMessageCount(user!.id),
    enabled: !!user,
  })

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Error signing out')
    } else {
      toast.success('Signed out successfully')
    }
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-3 text-xl md:text-2xl font-bold text-black hover:text-orange-600 transition-colors">
          <img src="/icons/prodavajbrzoicon.png" alt="ProdavajBrzo Logo" className="h-8 w-8 md:h-10 md:w-10" />
          ProdavajBrzo
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          {user && (
            <Link href="/dashboard/new">
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-3 py-1 flex items-center gap-1 text-sm font-medium shadow-md hover:shadow-lg transition-all">
                <span className="text-lg">+</span>
                <span className="hidden sm:inline">Add</span>
              </Button>
            </Link>
          )}

          {user ? (
            <>
              <Link href="/chat">
                <Button variant="outline" size="sm" className="border-2 hover:border-orange-500 text-xs md:text-sm px-2 md:px-4 relative">
                  <Mail className="h-4 w-4 mr-1" />
                  Messages
                  <span className={`absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full ${
                    unreadCount && unreadCount > 0 ? 'bg-red-500 text-white' : 'bg-gray-400 text-white'
                  }`}>
                    {unreadCount && unreadCount > 99 ? '99+' : (unreadCount || 0)}
                  </span>
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="border-2 hover:border-orange-500 text-xs md:text-sm px-2 md:px-4">
                  Dashboard
                </Button>
              </Link>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="border-2 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors text-xs md:text-sm px-2 md:px-4">
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/auth">
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white text-xs md:text-sm px-2 md:px-4">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}