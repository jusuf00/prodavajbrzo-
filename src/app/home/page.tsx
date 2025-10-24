'use client'

import { useQuery } from '@tanstack/react-query'
import { getListings } from '@/lib/api'
import { ListingCard } from '@/components/ListingCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { Search, Package, Plus, ArrowRight, ArrowUp, Grid3X3 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/providers'
import { calculateDistance } from '@/lib/utils'

export default function HomePage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['listings-home'],
    queryFn: () => getListings(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => import('@/lib/api').then(m => m.getAllCategories()),
  })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Navigate to listings page with search parameters
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (category !== 'all') params.set('category', category)

    window.location.href = `/listings${params.toString() ? `?${params.toString()}` : ''}`
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading listings...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Error loading listings</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-200 via-yellow-50 to-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Welcome to ProdavajBrzo
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Find great deals on products from sellers worldwide. Buy and sell with ease!
          </p>

          {/* Add Listing Button - Show for all users but redirect to auth if not signed in */}
          <div className="mb-8">
            <Link href={user ? "/dashboard/new" : "/auth"}>
              <Button
                variant="outline"
                className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white hover:border-orange-700 px-6 py-3 text-lg font-medium transition-colors"
              >
                <Plus className="mr-2 h-5 w-5" />
                {user ? "Add New Listing" : "Sign In to Add Listing"}
              </Button>
            </Link>
          </div>

          {/* Compact Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 pr-4 py-3 text-lg border-2 border-orange-300 focus:ring-2 focus:ring-orange-500 rounded-lg"
                />
              </div>
              {/* Style 4: Grid-based Category Cards */}
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCategories(!showCategories)}
                  className="w-full md:w-48 py-3 px-4 text-lg border-gray-300 focus:ring-2 focus:ring-orange-500 rounded-lg flex items-center justify-between"
                >
                  <span>
                    {category === 'all' ? 'All categories' : categories?.find(cat => cat.id === category)?.name || 'All categories'}
                  </span>
                  <Grid3X3 className="h-4 w-4" />
                </Button>

                {showCategories && (
                  <div className="absolute top-full mt-2 w-full md:w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-4 max-h-96 overflow-y-auto">
                    <div className="flex flex-col gap-3">
                      <div
                        onClick={() => {
                          setCategory('all')
                          setShowCategories(false)
                        }}
                        className={`rounded-lg border-2 p-3 flex items-center cursor-pointer transition-all hover:scale-105 ${
                          category === 'all'
                            ? 'border-orange-500 bg-orange-50 shadow-md'
                            : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm font-medium">All Categories</span>
                      </div>

                      {categories?.map((cat, index) => (
                        <div
                          key={cat.id}
                          onClick={() => {
                            setCategory(cat.id)
                            setShowCategories(false)
                          }}
                          className={`rounded-lg border-2 p-3 flex items-center cursor-pointer transition-all hover:scale-105 ${
                            category === cat.id
                              ? 'border-orange-500 bg-orange-50 shadow-md'
                              : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 px-8 py-3 text-lg font-medium rounded-lg whitespace-nowrap"
              >
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Latest Listings Section */}
      <div className="bg-gradient-to-b from-white to-orange-50/20 container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Listings</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover the newest products added by our community of sellers
          </p>
        </div>

        {/* View All Button - Below title */}
        {listings && listings.length > 0 && (
          <div className="text-center mb-8">
            <Link href="/listings">
              <Button variant="outline" className="px-6 py-2 text-sm font-medium hover:bg-orange-50 hover:border-orange-200 transition-colors">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}

        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.slice(0, 8).map((listing) => {
              let distance: number | undefined
              if (userLocation && listing.location_lat && listing.location_lng) {
                distance = calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  listing.location_lat,
                  listing.location_lng
                )
              }
              return (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isActive={!listing.is_sold}
                  distance={distance}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
              <p className="text-gray-600 mb-6">
                Be the first to create a listing and start selling your products!
              </p>
              <Link href={user ? "/dashboard/new" : "/dashboard"}>
                <Button className="bg-orange-600 hover:bg-orange-700 hover:border-orange-500 hover:border-2 px-6 py-3">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Listing
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}