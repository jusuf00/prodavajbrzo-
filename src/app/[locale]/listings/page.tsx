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
import { useAuth } from '@/lib/providers'
import { ListingsGridSkeleton } from '@/components/ListingCardSkeleton'
import { useTranslations } from 'next-intl'

function ListingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { loading: authLoading } = useAuth()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'all')
  const t = useTranslations('listings')

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
    enabled: !authLoading, // Wait for auth to load
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

  // Show loading while auth is being restored
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex gap-4 flex-wrap items-end">
              <div className="flex-1 min-w-64">
                <div className="h-4 bg-gray-200 rounded mb-2 w-32"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="min-w-48">
                <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="mb-4 h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <ListingsGridSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">{t('error')}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">{t('title')}</h1>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-64">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t('searchProducts')}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <Input
                  id="search"
                  placeholder={t('searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
              <Label htmlFor="category-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t('category')}
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category-select" className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue placeholder={t('allCategories')} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">{t('allCategories')}</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2">
              <Search className="mr-2 h-4 w-4" />
              {t('search')}
            </Button>
            {category !== 'all' && (
              <Button type="button" onClick={clearFilters} variant="outline" className="flex items-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <X className="h-4 w-4" />
                {t('clearFilters')}
              </Button>
            )}
          </form>
        </div>

        {/* Results count */}
        <div className="mb-4 text-gray-600 dark:text-gray-300">
          {listings && listings.length > 0 ? (
            listings.length === 1 ? t('resultsCountOne') :
            t('resultsCountMany', { count: listings.length })
          ) : t('resultsCountZero')}
        </div>
      </div>

      {/* Listings */}
      {listings && listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} isActive={!listing.is_sold} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">{t('noListings')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {search || category ? t('noListingsDesc') : t('noListingsAvailable')}
          </p>
          {(search || category) && (
            <Button onClick={clearFilters} variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              {t('clearFiltersButton')}
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