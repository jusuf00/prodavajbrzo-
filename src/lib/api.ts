import { supabase } from './supabase'
import { Listing, Category, ListingImage } from './types'

export async function getListings(search?: string, category?: string) {
  try {
    console.log('getListings called with:', { search, category })

    let query = supabase
      .from('listings')
      .select(`
        *,
        category:categories(*),
        seller:user_profiles(*),
        images:listing_images(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (search) {
      console.log('Applying search filter:', search)
      query = query.ilike('title', `%${search}%`)
    }

    if (category) {
      console.log('Applying category filter:', category)
      query = query.eq('category_id', category)
    }

    console.log('Executing query...')
    const { data, error } = await query

    console.log('Query result:', { data: data?.length, error })

    if (error) throw error
    return data as Listing[]
  } catch (error) {
    console.error('Error fetching listings:', error)
    throw new Error('Failed to load listings')
  }
}

export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) throw error
    return data as Category[]
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw new Error('Failed to load categories')
  }
}

export async function getUserListings(userId: string) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        category:categories(*),
        seller:user_profiles(*)
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Listing[]
  } catch (error) {
    console.error('Error fetching user listings:', error)
    throw new Error('Failed to load your listings')
  }
}

export async function createListing(listing: Omit<Listing, 'id' | 'created_at' | 'seller'>) {
  try {
    console.log('Inserting listing data:', {
      seller_id: listing.seller_id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      category_id: listing.category_id,
      status: listing.status,
      location_lat: listing.location_lat,
      location_lng: listing.location_lng,
      location_address: listing.location_address,
    })

    const { data, error } = await supabase
      .from('listings')
      .insert({
        seller_id: listing.seller_id,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category_id: listing.category_id,
        status: listing.status,
        location_lat: listing.location_lat,
        location_lng: listing.location_lng,
        location_address: listing.location_address,
      })
      .select(`
        *,
        category:categories(*),
        seller:user_profiles(*)
      `)
      .single()

    console.log('Supabase response:', { data, error })

    if (error) throw error
    return data as Listing
  } catch (error) {
    console.error('Error creating listing:', error)
    throw new Error('Failed to create listing')
  }
}

export async function updateListing(id: string, updates: Partial<Listing>) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        category:categories(*),
        seller:user_profiles(*)
      `)
      .single()

    if (error) throw error
    return data as Listing
  } catch (error) {
    console.error('Error updating listing:', error)
    throw new Error('Failed to update listing')
  }
}

export async function deleteListing(id: string) {
  try {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting listing:', error)
    throw new Error('Failed to delete listing')
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw new Error('Failed to load user profile')
  }
}

export async function createUserProfile(profile: { id: string; username: string; display_name: string }) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating user profile:', error)
    throw new Error('Failed to create user profile')
  }
}

export async function getListingById(id: string) {
  try {
    console.log('Fetching listing with ID:', id)

    // First check if listing exists without images
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select(`
        *,
        category:categories(*),
        seller:user_profiles(*)
      `)
      .eq('id', id)
      .eq('status', 'active')
      .maybeSingle()

    console.log('Listing query result:', { listingData, listingError })

    if (listingError) {
      console.error('Listing query error:', listingError)
      throw listingError
    }

    if (!listingData) {
      console.log('No listing found for ID:', id)
      throw new Error('Listing not found')
    }

    // Then get images separately
    const { data: imagesData, error: imagesError } = await supabase
      .from('listing_images')
      .select('*')
      .eq('listing_id', id)
      .order('order_index')

    console.log('Images query result:', { imagesData, imagesError })

    if (imagesError) {
      console.error('Images query error:', imagesError)
      // Don't throw here, just log - images are optional
    }

    const listing = {
      ...listingData,
      images: imagesData || []
    }

    console.log('Final listing data:', listing)
    return listing as Listing
  } catch (error) {
    console.error('Error fetching listing:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw new Error('Listing not found')
  }
}

export async function getUserListingById(userId: string, listingId: string) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        category:categories(*),
        seller:user_profiles(*),
        images:listing_images(*)
      `)
      .eq('id', listingId)
      .eq('seller_id', userId)
      .single()

    if (error) throw error
    return data as Listing
  } catch (error) {
    console.error('Error fetching user listing:', error)
    throw new Error('Listing not found')
  }
}

export async function createListingImages(listingId: string, images: { url: string; isDefault: boolean; orderIndex: number }[]) {
  try {
    console.log(`Creating ${images.length} image records for listing ${listingId}`)

    const imageRecords = images.map(img => ({
      listing_id: listingId,
      image_url: img.url,
      is_default: img.isDefault,
      order_index: img.orderIndex
    }))

    console.log('Image records to insert:', imageRecords)

    const { data, error } = await supabase
      .from('listing_images')
      .insert(imageRecords)
      .select()

    console.log('Image records created:', { data, error })

    if (error) throw error
    return data as ListingImage[]
  } catch (error) {
    console.error('Error creating listing images:', error)
    throw new Error('Failed to create listing images')
  }
}