'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/providers'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function Header() {
  const { user, loading } = useAuth()

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

          {user ? (
            <>
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