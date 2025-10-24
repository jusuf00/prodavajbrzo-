import { Listing } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTimeAgo, formatDistance } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, MapPin } from 'lucide-react'

interface ListingCardProps {
  listing: Listing
  isActive?: boolean
  distance?: number
}

export function ListingCard({ listing, isActive, distance }: ListingCardProps) {
  // Get the default image or first image from the images array, fallback to legacy image_url
  const displayImage = listing.images && listing.images.length > 0
    ? (listing.images.find(img => img.is_default) || listing.images[0]).image_url
    : listing.image_url

  return (
    <Link href={`/listings/${listing.id}`} className="block h-full">
      <div className="relative group h-full">
        <Card className={`relative ${isActive ? 'hover:border-orange-500' : ''} bg-white h-full flex flex-col`}>
          {displayImage && (
            <div className="aspect-video relative overflow-hidden rounded-t-lg">
              <Image
                src={displayImage}
                alt={listing.title}
                fill
                className="object-contain bg-gray-50"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
          <CardHeader className="flex-shrink-0 relative">
            <CardTitle className="text-lg hover:text-orange-600">
              {listing.title}
            </CardTitle>
            {distance && (
              <div className="absolute top-0 right-2 text-xs text-white bg-green-600 px-2 py-1 rounded-full font-medium shadow-sm">
                {formatDistance(distance)}
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <p className="text-gray-600 mb-2 line-clamp-2">{listing.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-orange-600">
                {listing.price % 1 === 0 ? listing.price.toFixed(0) : listing.price.toFixed(2)} MKD
              </span>
              <span className="text-sm text-gray-500">
                {listing.category?.name}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
              <span>By {listing.seller?.display_name || listing.seller?.username}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(listing.created_at)}
              </span>
            </div>
            {listing.location_address && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="truncate">{listing.location_address}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Link>
  )
}