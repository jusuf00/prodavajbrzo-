'use client'

import { useQuery } from '@tanstack/react-query'
import { getListings, getCategories } from '@/lib/api'
import { ListingCard } from '@/components/ListingCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Suspense } from 'react'

function ListingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'all')

  const { data: listings, isLoading, error, refetch } = useQuery({
    queryKey: ['listings', searchParams.get('q'), searchParams.get('category')],
    queryFn: () => {
      console.log('Fetching listings with params:', {
        q: searchParams.get('q'),
        category: searchParams.get('category')
      })
      const urlSearch = searchParams.get('q') || ''
      const urlCategory = searchParams.get('category') || ''
      return getListings(urlSearch || undefined, urlCategory || undefined)
    },
    retry: 3,
    retryDelay: 1000,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: true, // Always fetch listings
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  // Manual search trigger - only update URL and fetch when user explicitly searches
  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (category !== 'all') params.set('category', category)

    const newUrl = `/listings${params.toString() ? `?${params.toString()}` : ''}`
    router.push(newUrl) // Use push to navigate and trigger query
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('all')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Loading listings...</p>
        </div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Browse Listings</h1>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-64">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                Search Products
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSearch()
                    }
                  }}
                />
              </div>
            </div>
            <div className="min-w-48">
              <Label htmlFor="category-select" className="text-sm font-medium text-gray-700 mb-2 block">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category-select">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 px-6 py-2">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            {category !== 'all' && (
              <Button type="button" onClick={clearFilters} variant="outline" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </form>
        </div>

        {/* Results count */}
        <div className="mb-4 text-gray-600">
          {listings ? `${listings.length} listing${listings.length !== 1 ? 's' : ''} found` : 'No listings found'}
        </div>
      </div>

      {/* Listings */}
      {listings && listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} isActive={listing.status === 'active'} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">No listings found</h2>
          <p className="text-gray-600 mb-4">
            {search || category ? 'Try adjusting your search or filters.' : 'No listings are available at the moment.'}
          </p>
          {(search || category) && (
            <Button onClick={clearFilters} variant="outline">
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><div className="text-center">Loading...</div></div>}>
      <ListingsContent />
    </Suspense>
  )
}