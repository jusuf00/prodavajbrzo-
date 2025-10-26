'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, usePathname } from 'next/navigation'
import { getListingById } from '@/lib/api'
import { useAuth } from '@/lib/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Calendar, Tag, MapPin, MessageCircle, ChevronLeft, ChevronRight, Navigation, Map, X, Copy, Share2, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { getOrCreateConversation } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ChatModal } from '@/components/ChatModal'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

// Dynamically import the map component to avoid SSR issues
const LocationDisplayMap = dynamic(() => import('@/components/LocationDisplayMap'), {
  ssr: false,
  loading: () => <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
})

export default function ListingDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const t = useTranslations('listingDetail')
  const pathname = usePathname()
  const [locale, setLocale] = useState('en')

  useEffect(() => {
    const pathLocale = pathname.split('/')[1]
    if (pathLocale && (pathLocale === 'en' || pathLocale === 'mk')) {
      setLocale(pathLocale)
    }
  }, [pathname])

  console.log('ListingDetailPage render', { isChatModalOpen })

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListingById(id),
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handleContactSeller = () => {
    console.log('Contact seller clicked', { user: !!user, listing: !!listing, isChatModalOpen })
    if (!user) {
      toast.error('Please sign in to contact the seller', {
        description: (
          <Link
            href={`/${locale}/auth`}
            className="inline-flex items-center px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-md transition-colors"
            onClick={() => toast.dismiss()}
          >
            Sign In
          </Link>
        ),
        style: { backgroundColor: '#fed7aa', borderLeft: '4px solid #ea580c', color: '#000000' },
      })
      return
    }
    if (!listing) {
      toast.error('Listing not loaded', {
        action: {
          label: <X className="h-4 w-4" />,
          onClick: () => {},
        },
      })
      return
    }
    if (user.id === (listing as any).seller_id) {
      toast.error('Cannot contact yourself', {
        action: {
          label: <X className="h-4 w-4" />,
          onClick: () => {},
        },
      })
      return
    }
    console.log('Setting isChatModalOpen to true')
    setIsChatModalOpen(prev => {
      console.log('Previous state:', prev)
      return true
    })
  }

  const handleShareListing = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Listing link copied to clipboard!', {
        duration: 2000,
      })
    }).catch(() => {
      toast.error('Failed to copy link', {
        duration: 2000,
      })
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center loading-pulse">
          <div className="loading-spinner w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full mx-auto mb-4 shadow-md"></div>
          <div className="space-y-1">
            <p className="text-lg font-medium text-gray-800">{t('loadingListing')}</p>
            <p className="text-sm text-gray-500">{t('pleaseWait')}</p>
          </div>
        </div>
      </div>
    )
  }
  if (error || !listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('listingNotFound')}</h1>
          <p className="text-gray-600 mb-4">The listing you're looking for doesn't exist or has been removed.</p>
          <Link href={`/${locale}/listings`}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToListings')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href={`/${locale}/listings`}>
          <Button variant="outline" className="hover:border-orange-500">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToListings')}
          </Button>
        </Link>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Image Gallery */}
        <div>
          {listing.images && listing.images.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              {/* Main Image with Navigation */}
              <div className="relative mb-4">
                <div className="aspect-video relative overflow-hidden rounded-lg">
                  <Image
                    key={currentImageIndex} // Force re-render for smooth transition
                    src={listing.images[currentImageIndex].image_url}
                    alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                    fill
                    className="object-contain bg-gray-50 transition-all duration-500 ease-in-out transform"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>

                {/* Navigation Arrows */}
                {listing.images && listing.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === 0 ? listing.images!.length - 1 : prev - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === listing.images!.length - 1 ? 0 : prev + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {listing.images!.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Grid */}
              {listing.images && listing.images.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {listing.images.map((image, index) => (
                    <div
                      key={image.id}
                      className={`aspect-square relative overflow-hidden rounded-lg cursor-pointer border-2 transition-colors ${
                        index === currentImageIndex ? 'border-orange-500' : 'border-transparent hover:border-orange-300'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <Image
                        src={image.image_url}
                        alt={`${listing.title} - Thumbnail ${index + 1}`}
                        fill
                        className="object-contain bg-gray-50 hover:scale-105 transition-transform"
                        sizes="(max-width: 1024px) 20vw, 10vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : listing.image_url ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <div className="aspect-video relative overflow-hidden rounded-lg">
                <Image
                  src={listing.image_url}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
              <div className="text-gray-500 dark:text-gray-400 text-center">
                <Tag className="mx-auto h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg">{t('noImageAvailable')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Product Details */}
        <div className="space-y-4">
          {/* Title Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{listing.title}</h2>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {listing.price % 1 === 0 ? listing.price.toFixed(0) : listing.price.toFixed(2)} ден
            </div>
            <Badge variant="secondary" className="px-2 py-1 text-xs bg-orange-600 text-white mb-3">
              {listing.category?.name}
            </Badge>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span className="font-medium">{t('posted')} {new Date(listing.created_at).toLocaleDateString()}</span>
              </div>
              {listing.location_lat && listing.location_lng && listing.location_address && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-green-900 dark:text-green-100">
                      {(() => {
                        const parts = listing.location_address.split(', ');
                        // Find Skopje and show: [area before Skopje], Skopje, [postal code]
                        const skopjeIndex = parts.findIndex(part => part.includes('Skopje'));
                        if (skopjeIndex !== -1) {
                          const areaName = parts[skopjeIndex - 1] || '';
                          // Look for postal code - search for numeric value after Skopje
                          let postalCode = '';
                          for (let i = skopjeIndex + 1; i < parts.length; i++) {
                            const match = parts[i].match(/^\d+/);
                            if (match) {
                              postalCode = match[0];
                              break;
                            }
                            // Stop if we hit country name
                            if (parts[i].includes('North Macedonia') || parts[i].includes('Macedonia')) {
                              break;
                            }
                          }
                          return postalCode ? `${areaName}, Skopje, ${postalCode}` : `${areaName}, Skopje`;
                        }
                        return listing.location_address;
                      })()}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {/* Seller Info and Share Button */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-3 mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {t('seller')}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                      {listing.seller?.display_name || listing.seller?.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('memberSince')} {new Date(listing.seller?.created_at || listing.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="h-12 w-px bg-gray-300 dark:bg-gray-600 mr-4"></div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => {
                      console.log('Button clicked directly')
                      handleContactSeller()
                    }}
                  >
                    <MessageCircle className="mr-1 h-3 w-3" />
                    {t('contactSeller')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareListing}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>



          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1">
              <span className="w-1 h-2 bg-orange-500 rounded-full"></span>
              {t('description')}
            </h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">{listing.description}</p>
          </div>

        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        listingId={(listing as any)?.id || ''}
        sellerId={(listing as any)?.seller_id || ''}
        listingTitle={(listing as any)?.title || ''}
        listingImage={(listing as any)?.images?.[0]?.image_url}
        sellerName={(listing as any)?.seller?.display_name || (listing as any)?.seller?.username || 'Seller'}
      />

    </div>
  )
}