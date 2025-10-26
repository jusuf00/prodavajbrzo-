'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/providers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { getUnreadMessageCount } from '@/lib/api'
import { Mail, Home, LogOut, Plus, PlusCircle, Sun, Moon, Languages, ChevronDown, Globe, Check, Menu, X } from 'lucide-react'
import ReactCountryFlag from 'react-country-flag'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { getThemePreference, setThemePreference } from '@/lib/storage'
import { useTranslations } from 'next-intl'

export function Header({ locale }: { locale: string }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutCooldown, setSignOutCooldown] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showDesktopMenu, setShowDesktopMenu] = useState(false)
  const t = useTranslations('header')

  // Initialize theme from cookie on mount
  useEffect(() => {
    const savedTheme = getThemePreference()
    if (savedTheme && savedTheme !== theme) {
      setTheme(savedTheme)
    }
    setMounted(true)
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
        router.push(`/${locale}/home`)
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
          <Link href={`/${locale}/home`} className="flex items-center gap-2 md:gap-3 text-lg md:text-2xl font-bold text-black dark:text-white hover:text-black dark:hover:text-white transition-colors flex-shrink-0">
            <img src="/icons/prodavajbrzoicon2.png" alt="ProdavajBrzo Logo" className="h-6 w-6 md:h-10 md:w-10" />
            ProdavajBrzo
          </Link>


          <div className="flex items-center gap-1 md:gap-4 flex-shrink-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Desktop Header Items */}
            <div className="hidden md:flex items-center gap-4">
              {/* Expandable Menu Button */}
              <div className="relative">
                <button
                  onClick={() => setShowDesktopMenu(!showDesktopMenu)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Menu className="h-4 w-4" />
                  <span>Menu</span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {showDesktopMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      {/* Language Selector */}
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('language')}</div>
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              router.push(pathname.replace(`/${locale}/`, '/en/'))
                              setShowDesktopMenu(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between rounded ${
                              locale === 'en' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <ReactCountryFlag countryCode="US" svg style={{ width: '20px', height: '15px' }} />
                              {t('english')}
                            </div>
                            {locale === 'en' && <Check className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                          </button>
                          <button
                            onClick={() => {
                              router.push(pathname.replace(`/${locale}/`, '/mk/'))
                              setShowDesktopMenu(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between rounded ${
                              locale === 'mk' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <ReactCountryFlag countryCode="MK" svg style={{ width: '20px', height: '15px' }} />
                              {t('macedonian')}
                            </div>
                            {locale === 'mk' && <Check className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                          </button>
                        </div>
                      </div>

                      {/* Theme Toggle */}
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('theme')}</div>
                        <div className="flex items-center justify-center gap-3">
                          <Sun className={`h-5 w-5 transition-all duration-300 ${
                            mounted && theme === 'dark' ? 'opacity-50 scale-90 text-yellow-500' : 'opacity-100 scale-100 text-yellow-600'
                          }`} />

                          <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              mounted && theme === 'dark' ? 'bg-orange-500' : 'bg-gray-200'
                            }`}
                            aria-label="Toggle theme"
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                mounted && theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                            <span className="sr-only">Toggle theme</span>
                          </button>

                          <Moon className={`h-5 w-5 transition-all duration-300 ${
                            mounted && theme === 'dark' ? 'opacity-100 scale-100 text-white' : 'opacity-50 scale-90 text-gray-600'
                          }`} />
                        </div>
                      </div>

                      {/* User Actions */}
                      {user && (
                        <div className="px-4 py-2">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('actions')}</div>
                          <div className="space-y-3">
                            <div className="mb-3">
                              <Link href="/dashboard/new" onClick={() => setShowDesktopMenu(false)}>
                                <Button size="sm" className="w-full justify-start bg-orange-600 hover:bg-orange-700 text-white">
                                  <PlusCircle className="h-4 w-4 mr-2" />
                                  {t('add')}
                                </Button>
                              </Link>
                            </div>
                            <div className="mb-3">
                              <Link href={`/${locale}/chat`} onClick={() => setShowDesktopMenu(false)}>
                                <Button variant="outline" size="sm" className="w-full justify-start border-2 hover:border-orange-500 relative">
                                  <Mail className="h-4 w-4 mr-2" />
                                  {t('messages')}
                                  <span className={`absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full ${
                                    unreadCount && unreadCount > 0 ? 'bg-red-500 text-white' : 'bg-gray-400 text-white'
                                  }`}>
                                    {unreadCount && unreadCount > 99 ? '99+' : (unreadCount || 0)}
                                  </span>
                                </Button>
                              </Link>
                            </div>
                            <div>
                              <Link href="/dashboard" onClick={() => setShowDesktopMenu(false)}>
                                <Button variant="outline" size="sm" className="w-full justify-start border-2 hover:border-orange-500">
                                  <Home className="h-4 w-4 mr-2" />
                                  {t('dashboard')}
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sign In for non-users */}
                      {!user && pathname !== `/${locale}/auth` && (
                        <div className="px-4 py-2">
                          <Link href={`/${locale}/auth`} onClick={() => setShowDesktopMenu(false)}>
                            <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                              {t('signIn')}
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {user && (
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  disabled={isSigningOut || signOutCooldown > 0}
                  className={`border-2 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors text-sm px-4 ${
                    isSigningOut || signOutCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSigningOut ? (
                    <div className="loading-spinner h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-1" />
                  )}
                  {isSigningOut ? t('signingOut') : signOutCooldown > 0 ? t('waitSeconds', { seconds: signOutCooldown }) : t('signOut')}
                </Button>
              )}
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
              <div className="md:hidden fixed top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
                <div className="container mx-auto px-4 py-4 space-y-4">
                  {/* Language Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full justify-center"
                    >
                      <Globe className="h-4 w-4" />
                      {locale === 'mk' ? 'МК' : 'EN'}
                      <ChevronDown className="h-3 w-3" />
                    </button>

                    {showLanguageMenu && (
                      <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              router.push(pathname.replace(`/${locale}/`, '/en/'))
                              setShowLanguageMenu(false)
                              setShowMobileMenu(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                              locale === 'en' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <ReactCountryFlag countryCode="US" svg style={{ width: '20px', height: '15px' }} />
                              {t('english')}
                            </div>
                            {locale === 'en' && <Check className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                          </button>
                          <button
                            onClick={() => {
                              router.push(pathname.replace(`/${locale}/`, '/mk/'))
                              setShowLanguageMenu(false)
                              setShowMobileMenu(false)
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                              locale === 'mk' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <ReactCountryFlag countryCode="MK" svg style={{ width: '20px', height: '15px' }} />
                              {t('macedonian')}
                            </div>
                            {locale === 'mk' && <Check className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Theme Toggle */}
                  <div className="flex items-center justify-center gap-3">
                    <Sun className={`h-5 w-5 transition-all duration-300 ${
                      mounted && theme === 'dark' ? 'opacity-50 scale-90 text-yellow-500' : 'opacity-100 scale-100 text-yellow-600'
                    }`} />

                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        mounted && theme === 'dark' ? 'bg-orange-500' : 'bg-gray-200'
                      }`}
                      aria-label="Toggle theme"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          mounted && theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                      <span className="sr-only">Toggle theme</span>
                    </button>

                    <Moon className={`h-5 w-5 transition-all duration-300 ${
                      mounted && theme === 'dark' ? 'opacity-100 scale-100 text-white' : 'opacity-50 scale-90 text-gray-600'
                    }`} />
                  </div>

                  {user ? (
                    <div className="space-y-3">
                      <Link href="/dashboard/new" onClick={() => setShowMobileMenu(false)}>
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white w-full">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          {t('add')}
                        </Button>
                      </Link>
                      <Link href={`/${locale}/chat`} onClick={() => setShowMobileMenu(false)}>
                        <Button variant="outline" size="sm" className="border-2 hover:border-orange-500 w-full relative">
                          <Mail className="h-4 w-4 mr-2" />
                          {t('messages')}
                          <span className={`absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full ${
                            unreadCount && unreadCount > 0 ? 'bg-red-500 text-white' : 'bg-gray-400 text-white'
                          }`}>
                            {unreadCount && unreadCount > 99 ? '99+' : (unreadCount || 0)}
                          </span>
                        </Button>
                      </Link>
                      <Link href="/dashboard" onClick={() => setShowMobileMenu(false)}>
                        <Button variant="outline" size="sm" className="border-2 hover:border-orange-500 w-full">
                          <Home className="h-4 w-4 mr-2" />
                          {t('dashboard')}
                        </Button>
                      </Link>
                      <Button
                        onClick={() => {
                          handleSignOut()
                          setShowMobileMenu(false)
                        }}
                        variant="outline"
                        size="sm"
                        disabled={isSigningOut || signOutCooldown > 0}
                        className={`border-2 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors w-full ${
                          isSigningOut || signOutCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSigningOut ? (
                          <div className="loading-spinner h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4 mr-2" />
                        )}
                        {isSigningOut ? t('signingOut') : signOutCooldown > 0 ? t('waitSeconds', { seconds: signOutCooldown }) : t('signOut')}
                      </Button>
                    </div>
                  ) : pathname !== `/${locale}/auth` && (
                    <Link href={`/${locale}/auth`} onClick={() => setShowMobileMenu(false)}>
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white w-full">
                        {t('signIn')}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
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