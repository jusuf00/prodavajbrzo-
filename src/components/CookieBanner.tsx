'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Cookie } from 'lucide-react'
import { hasCookieConsent, setCookieConsent } from '@/lib/storage'

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = hasCookieConsent()
    const dismissed = localStorage.getItem('cookieBannerDismissed') === 'true'

    if (!hasConsent && !dismissed) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    setCookieConsent(true)
    setShowBanner(false)
    // Dispatch event to notify other components that cookies were accepted
    window.dispatchEvent(new CustomEvent('cookieConsentAccepted'))
  }

  const handleDismiss = () => {
    // Mark as dismissed for 7 days
    localStorage.setItem('cookieBannerDismissed', 'true')
    setTimeout(() => {
      localStorage.removeItem('cookieBannerDismissed')
    }, 7 * 24 * 60 * 60 * 1000) // 7 days
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Cookie className="h-6 w-6 text-orange-500 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                We use cookies
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                We use cookies to enhance your experience, including location services for showing distances to listings.
                By continuing to use our site, you agree to our use of cookies.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleAccept}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm"
            >
              Accept All
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 text-sm"
            >
              <X className="h-4 w-4 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}