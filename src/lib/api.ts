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
      .eq('is_sold', false)
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
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw new Error('Failed to load listings')
  }
}

export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null) // Only get main categories
      .order('name')

    if (error) throw error
    return data as Category[]
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw new Error('Failed to load categories')
  }
}

export async function getAllCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) throw error
    return data as Category[]
  } catch (error) {
    console.error('Error fetching all categories:', error)
    throw new Error('Failed to load categories')
  }
}

export async function getSubcategories(parentId: string) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('name')

    if (error) throw error
    return data as Category[]
  } catch (error) {
    console.error('Error fetching subcategories:', error)
    throw new Error('Failed to load subcategories')
  }
}

export async function getUserListings(userId: string) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        category:categories(*),
        seller:user_profiles(*),
        images:listing_images(*)
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

export async function createListing(listing: Omit<Listing, 'id' | 'created_at' | 'seller' | 'is_sold'>) {
  try {
    console.log('Inserting listing data:', {
      seller_id: listing.seller_id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      category_id: listing.category_id,
      is_sold: false,
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
        is_sold: false,
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
    console.error('Error details:', JSON.stringify(error, null, 2))
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

export async function markListingAsSold(id: string) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .update({ is_sold: true })
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
    console.error('Error marking listing as sold:', error)
    throw new Error('Failed to mark listing as sold')
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
        seller:user_profiles(*),
        images:listing_images(*)
      `)
      .eq('id', id)
      .eq('is_sold', false)
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

// Chat functionality functions
export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  is_read: boolean
  sender?: {
    display_name: string
    username: string
 }
}

export type Conversation = {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  created_at: string
  updated_at: string
  listing?: {
    title: string
    price: number
    images?: {
      image_url: string
      is_default: boolean
    }[]
  }
  buyer?: {
    display_name: string
    username: string
  }
  seller?: {
    display_name: string
    username: string
 }
  latest_message?: Message
  unread_count?: number
}

export async function getConversationsWithLatestMessage(userId: string) {
  try {
    // First get conversations without joins
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('updated_at', { ascending: false })

    if (convError) throw convError

    if (!conversations || conversations.length === 0) {
      return []
    }

    // Get conversation IDs
    const conversationIds = conversations.map(c => c.id)
    const listingIds = [...new Set(conversations.map(c => c.listing_id))]

    // Get listings data separately
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title, price, images:listing_images(image_url, is_default)')
      .in('id', listingIds)

    if (listingsError) {
      console.error('Error fetching listings:', listingsError)
    }

    // Get user profiles separately
    const userIds = [...new Set([...conversations.map(c => c.buyer_id), ...conversations.map(c => c.seller_id)])]
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, display_name, username')
      .in('id', userIds)

    if (usersError) {
      console.error('Error fetching users:', usersError)
    }

    // Get latest message for each conversation
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at, sender_id, is_read')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
      .limit(1)

    if (msgError) throw msgError

    // Create lookup maps
    const listingsMap = (listings || []).reduce((acc, listing) => {
      acc[listing.id] = listing
      return acc
    }, {} as Record<string, any>)

    const usersMap = (users || []).reduce((acc, user) => {
      acc[user.id] = user
      return acc
    }, {} as Record<string, any>)

    // Group messages by conversation and get latest
    const latestMessages: { [key: string]: any } = {}
    const unreadCounts: { [key: string]: number } = {}

    // Get all messages for unread count calculation
    const { data: allMessages, error: allMsgError } = await supabase
      .from('messages')
      .select('conversation_id, sender_id, is_read')
      .in('conversation_id', conversationIds)

    if (allMsgError) {
      console.error('Error fetching all messages for unread count:', allMsgError)
    }

    // Calculate unread counts
    allMessages?.forEach(msg => {
      if (!msg.is_read && msg.sender_id !== userId) {
        unreadCounts[msg.conversation_id] = (unreadCounts[msg.conversation_id] || 0) + 1
      }
    })

    // Set latest messages
    messages?.forEach(msg => {
      if (!latestMessages[msg.conversation_id]) {
        latestMessages[msg.conversation_id] = msg
      }
    })

    // Combine conversations with latest messages
    const processedConversations = conversations.map(conv => ({
      ...conv,
      listing: listingsMap[conv.listing_id] || null,
      buyer: usersMap[conv.buyer_id] || null,
      seller: usersMap[conv.seller_id] || null,
      latest_message: latestMessages[conv.id] || null,
      unread_count: unreadCounts[conv.id] || 0
    }))

    return processedConversations as Conversation[]
  } catch (error) {
    console.error('Error in getConversationsWithLatestMessage:', error)
    // Return empty array instead of throwing to prevent app crashes
    return []
  }
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:user_profiles(display_name, username)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Message[]
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ 
      conversation_id: conversationId, 
      sender_id: senderId, 
      content 
    })
    .select()
    .single()

 if (error) throw error
  return data as Message
}

export async function createConversation(listingId: string, buyerId: string, sellerId: string) {
  console.log('createConversation called with:', { listingId, buyerId, sellerId })

  const { data, error } = await supabase
    .from('conversations')
    .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
    .select()
    .single()

  console.log('createConversation result:', { data, error })

  if (error) throw error
  return data
}

export async function getOrCreateConversation(listingId: string, buyerId: string, sellerId: string) {
  console.log('getOrCreateConversation called with:', { listingId, buyerId, sellerId })

  // First, try to find existing conversation
  const { data: existing, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .eq('seller_id', sellerId)
    .single()

  console.log('Existing conversation query result:', { existing, error })

  if (existing) {
    console.log('Found existing conversation:', existing)
    return existing
  }

  // If not found, create new one
  console.log('Creating new conversation...')
  const newConversation = await createConversation(listingId, buyerId, sellerId)
  console.log('Created new conversation:', newConversation)
  return newConversation
}

export async function markConversationRead(conversationId: string, userId: string) {
  console.log('markConversationRead called with:', { conversationId, userId })

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .eq('is_read', false)
    .neq('sender_id', userId)

  console.log('markConversationRead result:', { error })

  if (error) throw error
  return { success: true }
}

export async function getUnreadMessageCount(userId: string) {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)
    .neq('sender_id', userId)
    .in('conversation_id', 
      await supabase
        .from('conversations')
        .select('id', { head: true })
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .then(res => res.data?.map(c => c.id) || [])
    )

  if (error) throw error
  return count || 0
}
