-- ProdavajBrzo Database Schema
-- Run this in your Supabase SQL Editor

-- Note: Skip the ALTER DATABASE line if you get permission errors
-- It's not required for the basic functionality

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_sold BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add location columns to existing listings table (if they don't exist)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_lat NUMERIC(10,8);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_lng NUMERIC(11,8);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Create listing_images table
CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories with subcategories
-- Main categories
INSERT INTO categories (name, slug, icon) VALUES
  ('Vehicles', 'vehicles', 'car'),
  ('Real Estate', 'real-estate', 'home'),
  ('Electronics', 'electronics', 'smartphone'),
  ('Home & Garden', 'home-garden', 'sofa'),
  ('Fashion & Beauty', 'fashion-beauty', 'shirt'),
  ('Jobs', 'jobs', 'briefcase'),
  ('Services', 'services', 'wrench'),
  ('Sports & Hobbies', 'sports-hobbies', 'football'),
  ('Pets', 'pets', 'paw-print'),
  ('Kids & Baby', 'kids-baby', 'baby'),
  ('Agriculture', 'agriculture', 'tractor'),
  ('Free Stuff', 'free-stuff', 'gift'),
  ('Lost & Found', 'lost-found', 'search'),
  ('Events & Tickets', 'events-tickets', 'ticket')
ON CONFLICT (slug) DO NOTHING;

-- Subcategories
INSERT INTO categories (name, slug, parent_id) VALUES
  -- Vehicles
  ('Cars', 'cars', (SELECT id FROM categories WHERE slug = 'vehicles')),
  ('Motorcycles', 'motorcycles', (SELECT id FROM categories WHERE slug = 'vehicles')),
  ('Car Parts & Accessories', 'car-parts-accessories', (SELECT id FROM categories WHERE slug = 'vehicles')),
  ('Trucks & Vans', 'trucks-vans', (SELECT id FROM categories WHERE slug = 'vehicles')),

  -- Real Estate
  ('Apartments for Sale', 'apartments-for-sale', (SELECT id FROM categories WHERE slug = 'real-estate')),
  ('Apartments for Rent', 'apartments-for-rent', (SELECT id FROM categories WHERE slug = 'real-estate')),
  ('Houses', 'houses', (SELECT id FROM categories WHERE slug = 'real-estate')),
  ('Land & Plots', 'land-plots', (SELECT id FROM categories WHERE slug = 'real-estate')),
  ('Commercial Properties', 'commercial-properties', (SELECT id FROM categories WHERE slug = 'real-estate')),

  -- Electronics
  ('Mobile Phones', 'mobile-phones', (SELECT id FROM categories WHERE slug = 'electronics')),
  ('Computers & Laptops', 'computers-laptops', (SELECT id FROM categories WHERE slug = 'electronics')),
  ('TVs, Audio & Video', 'tvs-audio-video', (SELECT id FROM categories WHERE slug = 'electronics')),
  ('Gaming Consoles', 'gaming-consoles', (SELECT id FROM categories WHERE slug = 'electronics')),
  ('Accessories', 'electronics-accessories', (SELECT id FROM categories WHERE slug = 'electronics')),

  -- Home & Garden
  ('Furniture', 'furniture', (SELECT id FROM categories WHERE slug = 'home-garden')),
  ('Home Appliances', 'home-appliances', (SELECT id FROM categories WHERE slug = 'home-garden')),
  ('Kitchen & Dining', 'kitchen-dining', (SELECT id FROM categories WHERE slug = 'home-garden')),
  ('Tools & Equipment', 'tools-equipment', (SELECT id FROM categories WHERE slug = 'home-garden')),
  ('Garden Supplies', 'garden-supplies', (SELECT id FROM categories WHERE slug = 'home-garden')),

  -- Fashion & Beauty
  ('Men''s Clothing', 'mens-clothing', (SELECT id FROM categories WHERE slug = 'fashion-beauty')),
  ('Women''s Clothing', 'womens-clothing', (SELECT id FROM categories WHERE slug = 'fashion-beauty')),
  ('Shoes', 'shoes', (SELECT id FROM categories WHERE slug = 'fashion-beauty')),
  ('Watches & Jewelry', 'watches-jewelry', (SELECT id FROM categories WHERE slug = 'fashion-beauty')),
  ('Cosmetics & Skincare', 'cosmetics-skincare', (SELECT id FROM categories WHERE slug = 'fashion-beauty')),

  -- Jobs
  ('Full-Time Jobs', 'full-time-jobs', (SELECT id FROM categories WHERE slug = 'jobs')),
  ('Part-Time Jobs', 'part-time-jobs', (SELECT id FROM categories WHERE slug = 'jobs')),
  ('Freelance / Remote', 'freelance-remote', (SELECT id FROM categories WHERE slug = 'jobs')),
  ('Internships', 'internships', (SELECT id FROM categories WHERE slug = 'jobs')),

  -- Services
  ('Repair & Maintenance', 'repair-maintenance', (SELECT id FROM categories WHERE slug = 'services')),
  ('Cleaning', 'cleaning', (SELECT id FROM categories WHERE slug = 'services')),
  ('Moving / Transport', 'moving-transport', (SELECT id FROM categories WHERE slug = 'services')),
  ('Beauty / Health Services', 'beauty-health-services', (SELECT id FROM categories WHERE slug = 'services')),
  ('Lessons & Tutoring', 'lessons-tutoring', (SELECT id FROM categories WHERE slug = 'services')),

  -- Sports & Hobbies
  ('Sports Equipment', 'sports-equipment', (SELECT id FROM categories WHERE slug = 'sports-hobbies')),
  ('Musical Instruments', 'musical-instruments', (SELECT id FROM categories WHERE slug = 'sports-hobbies')),
  ('Art & Collectibles', 'art-collectibles', (SELECT id FROM categories WHERE slug = 'sports-hobbies')),
  ('Books & Magazines', 'books-magazines', (SELECT id FROM categories WHERE slug = 'sports-hobbies')),

  -- Pets
  ('Dogs', 'dogs', (SELECT id FROM categories WHERE slug = 'pets')),
  ('Cats', 'cats', (SELECT id FROM categories WHERE slug = 'pets')),
  ('Birds', 'birds', (SELECT id FROM categories WHERE slug = 'pets')),
  ('Pet Accessories', 'pet-accessories', (SELECT id FROM categories WHERE slug = 'pets')),

  -- Kids & Baby
  ('Toys', 'toys', (SELECT id FROM categories WHERE slug = 'kids-baby')),
  ('Baby Clothes', 'baby-clothes', (SELECT id FROM categories WHERE slug = 'kids-baby')),
  ('Strollers & Car Seats', 'strollers-car-seats', (SELECT id FROM categories WHERE slug = 'kids-baby')),
  ('Baby Furniture', 'baby-furniture', (SELECT id FROM categories WHERE slug = 'kids-baby')),

  -- Agriculture
  ('Farm Equipment', 'farm-equipment', (SELECT id FROM categories WHERE slug = 'agriculture')),
  ('Seeds & Plants', 'seeds-plants', (SELECT id FROM categories WHERE slug = 'agriculture')),
  ('Livestock', 'livestock', (SELECT id FROM categories WHERE slug = 'agriculture'))
ON CONFLICT (slug) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- RLS Policies for categories
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

-- RLS Policies for listings
DROP POLICY IF EXISTS "View listings" ON listings;
CREATE POLICY "View listings" ON listings
  FOR SELECT USING (
    is_sold = false OR
    (select auth.uid()) = seller_id
  );

DROP POLICY IF EXISTS "Users can insert their own listings" ON listings;
CREATE POLICY "Users can insert their own listings" ON listings
  FOR INSERT WITH CHECK ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Users can update their own listings" ON listings;
CREATE POLICY "Users can update their own listings" ON listings
  FOR UPDATE USING ((select auth.uid()) = seller_id);

DROP POLICY IF EXISTS "Users can delete their own listings" ON listings;
CREATE POLICY "Users can delete their own listings" ON listings
  FOR DELETE USING ((select auth.uid()) = seller_id);

-- RLS Policies for listing_images
DROP POLICY IF EXISTS "View listing images" ON listing_images;
CREATE POLICY "View listing images" ON listing_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_images.listing_id
      AND (listings.is_sold = false OR listings.seller_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can insert images for their own listings" ON listing_images;
CREATE POLICY "Users can insert images for their own listings" ON listing_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_images.listing_id
      AND listings.seller_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update images for their own listings" ON listing_images;
CREATE POLICY "Users can update images for their own listings" ON listing_images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_images.listing_id
      AND listings.seller_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete images for their own listings" ON listing_images;
CREATE POLICY "Users can delete images for their own listings" ON listing_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_images.listing_id
      AND listings.seller_id = (select auth.uid())
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_is_sold ON listings(is_sold);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_is_default ON listing_images(is_default);
CREATE INDEX IF NOT EXISTS idx_listing_images_order_index ON listing_images(order_index);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(gen_random_uuid()::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Chat functionality tables
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, buyer_id, seller_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- Enable RLS for chat tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;
CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON messages;
CREATE POLICY "Users can delete messages in their conversations" ON messages
  FOR DELETE USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

-- Indexes for chat performance
CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);