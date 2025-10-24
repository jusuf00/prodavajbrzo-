export interface UserProfile {
  id: string
  username: string
  display_name: string
  avatar_url?: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string
  icon?: string
}

export interface ListingImage {
  id: string
  listing_id: string
  image_url: string
  is_default: boolean
  order_index: number
  created_at: string
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  description: string
  price: number
  category_id: string
  is_sold: boolean
  created_at: string
  image_url?: string // Keep for backward compatibility
  images?: ListingImage[]
  category?: Category
  seller?: UserProfile
  location_lat?: number
  location_lng?: number
  location_address?: string
}
