# ProdavajBrzo

A lightweight buy/sell marketplace web application built with Next.js, TypeScript, and Supabase.

## Features

- **Public Homepage**: Browse all active listings or see "No listings available" message
- **Search & Filter**: Find products by title and category
- **User Authentication**: Magic link email authentication (passwordless)
- **Dashboard**: Manage your listings with statistics
- **CRUD Operations**: Create, read, update, delete listings
- **Image Uploads**: Upload product images to Supabase Storage
- **Responsive Design**: Clean UI with white background, orange accents (#FF7A00), and black text

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui, Radix UI
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form, Zod validation
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Notifications**: Sonner toasts

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd prodavajbrzo
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Set up the database:
Run the SQL schema in your Supabase SQL Editor:
```sql
-- Copy the contents of database-schema.sql and run it in Supabase
```

5. Create a storage bucket:
In your Supabase dashboard, create a storage bucket called `listing-images` with public access.

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses three main tables:

- `user_profiles`: Extended user information
- `categories`: Product categories
- `listings`: Product listings with seller, category, and status information

## Project Structure

```
/app
  /(public)
    /home          # Public homepage
    /listings      # Search and filter page
    /dashboard     # User dashboard
    /auth          # Authentication page
  /api             # API routes (if needed)
/components
  Header.tsx       # Site header with auth
  Footer.tsx       # Site footer
  ListingCard.tsx  # Product listing card
/lib
  supabase.ts      # Supabase client
  providers.tsx    # React Query and Auth providers
  api.ts          # API functions
  storage.ts      # Image upload utilities
  types.ts        # TypeScript interfaces
```

## Features Overview

### Authentication
- Magic link email authentication
- Automatic user profile creation
- Session management with real-time updates

### Listings Management
- Create listings with title, description, price, category
- Upload product images
- Draft and active status management
- Edit and delete your own listings

### Search & Discovery
- Search by product title
- Filter by category
- Responsive grid layout
- Image previews

### Dashboard
- View all your listings
- Statistics (total, active, draft listings)
- Quick actions (edit, delete)

## Deployment

The application can be deployed to Vercel, Netlify, or any platform supporting Next.js:

1. Build the application:
```bash
npm run build
```

2. Deploy the `.next` folder and required files.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
