'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/providers'
import { getUserListings, deleteListing, getCategories, markListingAsSold, getUserProfile } from '@/lib/api'
import { ListingCard } from '@/components/ListingCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, BarChart3, Package, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function DashboardContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!authLoading && !user) {
      // Check if this is an invalid/expired magic link attempt
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (error === 'access_denied' || errorDescription?.includes('expired') || errorDescription?.includes('invalid')) {
        toast.error('This sign-in link has expired or is invalid. Please request a new magic link.', {
          duration: 6000,
          action: {
            label: 'Go to Sign In',
            onClick: () => router.push('/auth'),
          },
        })
        // Delay redirect to allow user to see the message
        setTimeout(() => router.push('/auth'), 1000)
      } else {
        router.push('/auth')
      }
    }
  }, [user, authLoading, router, searchParams])

  const { data: listings, isLoading } = useQuery({
    queryKey: ['user-listings', user?.id],
    queryFn: () => user ? getUserListings(user.id) : Promise.resolve([]),
    enabled: !!user,
    retry: 1,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => getUserProfile(user!.id),
    enabled: !!user,
  })


  const deleteMutation = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-listings'] })
      toast.success('Listing deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete listing')
    },
  })

  const markSoldMutation = useMutation({
    mutationFn: markListingAsSold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-listings'] })
      toast.success('Listing marked as sold!')
    },
    onError: () => {
      toast.error('Failed to mark listing as sold')
    },
  })

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      deleteMutation.mutate(id)
    }
  }

  // Show loading while auth is being restored
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        <div className="text-center loading-pulse">
          <div className="loading-spinner w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-6 shadow-lg"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800">Loading Dashboard</h2>
            <p className="text-gray-600">Preparing your listings...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  const activeListings = listings?.filter(l => !l.is_sold) || []
  const soldListings = listings?.filter(l => l.is_sold) || []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-xl font-semibold text-gray-900 mb-2">Welcome, {userProfile?.display_name || user?.email?.split('@')[0] || 'User'}!</p>
        <p className="text-gray-600">Manage your listings and view statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listings?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeListings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sold Listings</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{soldListings.length}</div>
          </CardContent>
        </Card>

      </div>

      {/* Actions */}
      <div className="mb-8">
        {/* Create New Listing button removed as requested */}
      </div>

      {/* Listings */}
      <div className="space-y-8">
        {/* Active Listings */}
        {activeListings.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Active Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {activeListings.map((listing) => (
                <div key={listing.id} className="flex flex-col md:relative">
                  <ListingCard listing={listing} isActive={true} />
                  <div className="flex gap-2 justify-end md:absolute md:top-2 md:right-2 md:justify-start mt-2 md:mt-0">
                    {listing.is_sold && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 mr-2">
                        SOLD
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                      onClick={() => markSoldMutation.mutate(listing.id)}
                      disabled={markSoldMutation.isPending}
                    >
                      {markSoldMutation.isPending ? 'Marking...' : 'Mark Sold'}
                    </Button>
                    <Link href={`/dashboard/${listing.id}/edit`}>
                      <Button size="sm" variant="outline">Edit</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(listing.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sold Listings */}
        {soldListings.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Sold Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {soldListings.map((listing) => (
                <div key={listing.id} className="flex flex-col md:relative">
                  <ListingCard listing={listing} isActive={false} />
                  <div className="flex gap-2 justify-end md:absolute md:top-2 md:right-2 md:justify-start mt-2 md:mt-0">
                    <Badge variant="secondary" className="bg-red-100 text-red-800 mr-2">
                      SOLD
                    </Badge>
                    <Link href={`/dashboard/${listing.id}/edit`}>
                      <Button size="sm" variant="outline">Edit</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(listing.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No listings */}
        {(!listings || listings.length === 0) && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No listings yet</h2>
            <p className="text-gray-600 mb-4">Create your first listing to get started</p>
            <Link href="/dashboard/new">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Listing
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        <div className="text-center loading-pulse">
          <div className="loading-spinner w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-6 shadow-lg"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800">Loading Dashboard</h2>
            <p className="text-gray-600">Preparing your listings...</p>
          </div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}