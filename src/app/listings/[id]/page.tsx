'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { getListingById } from '@/lib/api'
import { useAuth } from '@/lib/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Calendar, Tag, MapPin, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { getOrCreateConversation } from '@/lib/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ChatModal } from '@/components/ChatModal'
import { toast } from 'sonner'

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
      toast.error('Please sign in to contact the seller')
      return
    }
    if (!listing) {
      toast.error('Listing not loaded')
      return
    }
    if (user.id === (listing as any).seller_id) {
      toast.error('Cannot contact yourself')
      return
    }
    console.log('Setting isChatModalOpen to true')
    setIsChatModalOpen(prev => {
      console.log('Previous state:', prev)
      return true
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center loading-pulse">
          <div className="loading-spinner w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full mx-auto mb-4 shadow-md"></div>
          <div className="space-y-1">
            <p className="text-lg font-medium text-gray-800">Loading listing...</p>
            <p className="text-sm text-gray-500">Please wait</p>
          </div>
        </div>
      </div>
    )
  }
  if (error || !listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
          <p className="text-gray-600 mb-4">The listing you're looking for doesn't exist or has been removed.</p>
          <Link href="/home">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Listings
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
        <Link href="/listings">
          <Button variant="outline" className="hover:border-orange-500">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Listings
          </Button>
        </Link>
      </div>

      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">{listing.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <div className="text-3xl lg:text-4xl font-bold text-orange-600 dark:text-orange-400">
                {listing.price % 1 === 0 ? listing.price.toFixed(0) : listing.price.toFixed(2)} ден
              </div>
              <Badge variant="secondary" className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {listing.category?.name}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Posted {new Date(listing.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{listing.seller?.display_name || listing.seller?.username}</span>
              </div>
            </div>
          </div>
         <div className="flex gap-3 lg:flex-col lg:gap-2">
            {user && user.id !== (listing as any).seller_id && (
              <Button
                className="bg-orange-600 hover:bg-orange-700 px-6"
                onClick={() => {
                  console.log('Button clicked directly')
                  handleContactSeller()
                }}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact Seller
              </Button>
            )}
            <Button variant="outline" className="px-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Share Listing
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Gallery */}
        <div className="lg:col-span-2">
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
                    sizes="(max-width: 1024px) 100vw, 66vw"
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
                        sizes="(max-width: 1024px) 20vw, 13vw"
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
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
              <div className="text-gray-500 dark:text-gray-400 text-center">
                <Tag className="mx-auto h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg">No image available</p>
              </div>
            </div>
          )}
        </div>

        {/* Details Sidebar */}
        <div className="space-y-4">
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
              Description
            </h3>
            <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">{listing.description}</p>
          </div>

          {/* Location */}
          {listing.location_lat && listing.location_lng && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                Location
              </h3>
              <div className="space-y-3">
                <div className="h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700" role="application" aria-label="Location map">
                  <LocationDisplayMap
                    lat={listing.location_lat!}
                    lng={listing.location_lng!}
                    address={listing.location_address}
                  />
                </div>
                {listing.location_address && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">Address</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 break-words leading-tight">{listing.location_address}</p>
                  </div>
                )}
              </div>
            </div>
          )}

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