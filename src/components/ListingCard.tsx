import { Listing } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTimeAgo, formatDistance } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, MapPin } from 'lucide-react'
import { useParams } from 'next/navigation'

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

  const { locale } = useParams()

  return (
    <Link href={`/${locale}/listings/${listing.id}`} className="block h-full">
      <div className="relative group h-full">
        <Card className={`relative ${isActive ? 'hover:border-orange-500' : ''} bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-full flex flex-col`}>
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
            <CardTitle className="text-lg hover:text-orange-600 dark:text-white dark:hover:text-orange-400">
              {listing.title}
            </CardTitle>
            {distance && (
              <div className="absolute top-0 right-2 text-xs text-white bg-green-600 px-2 py-1 rounded-full font-medium shadow-sm">
                {formatDistance(distance)}
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            <p className="text-gray-600 dark:text-gray-200 mb-2 line-clamp-2">{listing.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {listing.price % 1 === 0 ? listing.price.toFixed(0) : listing.price.toFixed(2)} ден
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-300">
                {listing.category?.name}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-300">
              <span>By {listing.seller?.display_name || listing.seller?.username}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(listing.created_at)}
              </span>
            </div>
            {listing.location_address && (
              <div className="mt-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-2 py-1 rounded-md border border-green-200 dark:border-green-800">
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 text-white mr-2 flex-shrink-0" />
                  <span className="truncate font-medium text-green-900 dark:text-green-100">
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
          </CardContent>
        </Card>
      </div>
    </Link>
  )
}