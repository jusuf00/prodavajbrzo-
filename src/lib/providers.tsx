'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { Toaster } from '@/components/ui/sonner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1, // Simple retry count
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Add network mode to prevent hanging
      networkMode: 'online',
    },
    mutations: {
      retry: false,
      networkMode: 'online',
    },
  },
})

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Session error:', error)
        }
        if (mounted) {
          setUser(session?.user ?? null)
          // Add a small delay to prevent loading flicker
          setTimeout(() => {
            if (mounted) setLoading(false)
          }, 500)
        }
      } catch (error) {
        console.error('Error getting session:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        if (mounted) {
          setUser(session?.user ?? null)
          // Only set loading to false after a brief delay to prevent flicker
          setTimeout(() => {
            if (mounted) setLoading(false)
          }, 300)
        }

        // Create user profile if new user
        if (session?.user && event === 'SIGNED_IN') {
          try {
            // Check if profile exists
            const { data: existingProfile, error: selectError } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('id', session.user.id)
              .single()

            if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
              console.error('Error checking user profile:', selectError)
              return
            }

            if (!existingProfile) {
              // Create profile with default values
              const email = session.user.email || ''
              const username = email.split('@')[0] + Math.random().toString(36).substring(2, 8)
              const displayName = email.split('@')[0]

              const { error: insertError } = await supabase.from('user_profiles').insert({
                id: session.user.id,
                username,
                display_name: displayName,
              })

              if (insertError) {
                console.error('Error creating user profile:', insertError)
              }
            }
          } catch (error) {
            console.error('Error in user profile creation:', error)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontSize: '16px',
              padding: '16px',
              minWidth: '300px',
            },
          }}
        />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}