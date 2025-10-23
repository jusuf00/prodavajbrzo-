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
        <Link href="/home" className="flex items-center gap-3 text-2xl font-bold text-black hover:text-orange-600">
          <img src="/icons/prodavajbrzoicon.png" alt="ProdavajBrzo Logo" className="h-10 w-10" />
          ProdavajBrzo
        </Link>

        <div className="flex items-center gap-4">
          <div className="text-sm">
            {loading ? (
              <span className="text-gray-500">Loading...</span>
            ) : user ? (
              <span className="inline-block px-3 py-1 text-green-700 font-medium bg-green-50 border border-green-200 rounded-full">
                Signed in
              </span>
            ) : (
              <span className="inline-block px-3 py-1 text-gray-700 font-medium bg-gray-50 border border-gray-300 rounded-full">
                Not signed in
              </span>
            )}
          </div>

          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline" className="border-2 hover:border-orange-500">
                  Dashboard
                </Button>
              </Link>
              <Button onClick={handleSignOut} variant="outline" className="border-2 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors">
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/auth">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}