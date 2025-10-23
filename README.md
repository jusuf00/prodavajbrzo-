# ProdavajBrzo 🛒

A modern, lightweight buy/sell marketplace web application built with Next.js 16, TypeScript, and Supabase. Features a clean, responsive design with orange accent colors and smooth user experience.

![ProdavajBrzo](https://img.shields.io/badge/ProdavajBrzo-Marketplace-orange?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0VjE5QzE0IDIwLjEgMTMuMSAyMSAxMiAyMUMxMC45IDIxIDEwIDIwLjEgMTAgMTlWNFY0QzEwIDIuOSAxMC45IDIgMTIgMlpNMTIgN0MxMy4xIDcgMTQgNy45IDE0IDlWMThDMTQgMTkuMSAxMy4xIDIwIDEyIDIwQzEwLjkgMjAgMTAgMTkuMSAxMCAxOFY5QzEwIDcuOSAxMC45IDcgMTIgN1oiIGZpbGw9IiNGRjdBMDAiLz4KPC9zdmc+)

## ✨ Features

- **🏠 Public Homepage**: Browse latest active listings with hero section and search bar
- **🔍 Advanced Search & Filter**: Find products by title, category with real-time filtering
- **🔐 Passwordless Authentication**: Magic link email authentication via Supabase
- **📊 User Dashboard**: Comprehensive listing management with statistics and analytics
- **📝 Full CRUD Operations**: Create, read, update, delete listings with ease
- **🖼️ Image Management**: Multiple image uploads with Supabase Storage integration
- **📍 Location Features**: Interactive maps for listing locations using Leaflet
- **📱 Responsive Design**: Clean UI with white background, orange accents (#FF7A00), and smooth animations
- **⚡ Real-time Updates**: Live data synchronization with TanStack Query
- **🎨 Modern UI**: Built with Shadcn/ui components and Tailwind CSS

## 🛠️ Tech Stack

### Frontend Framework
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

### UI & Components
- **Shadcn/ui** - Modern component library
- **Radix UI** - Accessible, unstyled UI primitives
- **Lucide React** - Beautiful icon library

### State & Data Management
- **TanStack Query** - Powerful data synchronization
- **React Hook Form** - Performant forms with validation
- **Zod** - TypeScript-first schema validation

### Backend & Database
- **Supabase** - Open source Firebase alternative
  - PostgreSQL database
  - Real-time subscriptions
  - Built-in authentication
  - File storage
  - Edge functions

### Maps & Location
- **Leaflet** - Interactive maps
- **React Leaflet** - React components for Leaflet

### Development Tools
- **ESLint** - Code linting
- **Next.js ESLint config** - Framework-specific rules
- **Tailwind CSS v4** - Latest CSS framework version

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **Supabase Account** - Sign up at [supabase.com](https://supabase.com)
- **Git** - Version control system

### Quick Setup

1. **Clone the repository**:
```bash
git clone https://github.com/jusuf00/prodavajbrzo-.git
cd prodavajbrzo
```

2. **Install dependencies**:
```bash
npm install
```

3. **Environment Configuration**:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

4. **Database Setup**:
- Open your Supabase project dashboard
- Go to SQL Editor
- Copy and run the contents of `database-schema.sql`

5. **Storage Setup**:
- In Supabase dashboard, go to Storage
- Create a new bucket named `listing-images`
- Set it to public access

6. **Start Development Server**:
```bash
npm run dev
```

7. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

### 📋 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### 🔧 Development Workflow

```bash
# After making changes
npm run dev                    # Test locally
git add .                      # Stage changes
git commit -m "Your message"   # Commit changes
git push origin master         # Deploy to production
```

## Database Schema

The application uses three main tables:

- `user_profiles`: Extended user information
- `categories`: Product categories
- `listings`: Product listings with seller, category, and status information

## 📁 Project Structure

```
prodavajbrzo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/          # Public routes (no auth required)
│   │   │   ├── home/          # Landing page with hero section
│   │   │   ├── listings/      # Browse/search listings
│   │   │   └── page.tsx       # Root redirect
│   │   ├── auth/              # Authentication page
│   │   ├── dashboard/         # Protected user dashboard
│   │   │   ├── [id]/          # Dynamic routes for editing
│   │   │   ├── new/           # Create new listing
│   │   │   └── page.tsx       # Dashboard overview
│   │   ├── globals.css        # Global styles & Tailwind
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── page.tsx           # Home page redirect
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # Shadcn/ui components
│   │   ├── Header.tsx         # Navigation with auth
│   │   ├── Footer.tsx         # Site footer
│   │   ├── ListingCard.tsx    # Product card component
│   │   └── LocationMap.tsx    # Interactive map component
│   └── lib/                   # Utility libraries
│       ├── api.ts             # API functions for listings
│       ├── providers.tsx      # React Query & Auth providers
│       ├── storage.ts         # Image upload utilities
│       ├── supabase.ts        # Supabase client config
│       ├── types.ts           # TypeScript interfaces
│       └── utils.ts           # Helper functions
├── public/                    # Static assets
├── database-schema.sql        # Database setup
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS config
├── components.json           # Shadcn/ui config
└── package.json              # Dependencies & scripts
```

## 🎯 Key Features

### 🔐 Authentication System
- **Passwordless Login**: Magic link email authentication
- **Auto Profile Creation**: User profiles created automatically
- **Session Management**: Real-time session updates with Supabase
- **Secure**: No passwords stored, email-based authentication

### 📝 Complete Listings Management
- **Create Listings**: Rich form with title, description, price, category
- **Multiple Images**: Upload up to multiple product images
- **Location Integration**: Interactive maps for precise locations
- **Status Management**: Draft/Active status for listings
- **Full CRUD**: Create, Read, Update, Delete operations
- **Image Optimization**: Automatic image resizing and optimization

### 🔍 Advanced Search & Discovery
- **Real-time Search**: Instant search by product title
- **Category Filtering**: Filter by product categories
- **Responsive Grid**: Adaptive layout for all screen sizes
- **Image Galleries**: High-quality image previews
- **Location-based**: Find products near you

### 📊 User Dashboard
- **Analytics Overview**: Total, active, and draft listing counts
- **Quick Actions**: Edit and delete buttons on each listing
- **Status Indicators**: Visual status badges
- **Management Tools**: Comprehensive listing management interface

### 🗺️ Location Features
- **Interactive Maps**: Click-to-select locations
- **Geocoding**: Automatic address lookup
- **Current Location**: GPS-based location detection
- **Map Integration**: Leaflet-powered maps with custom markers

### 🎨 User Experience
- **Smooth Animations**: Hover effects and transitions
- **Orange Accents**: Consistent branding with #FF7A00
- **Clean Design**: White background, modern typography
- **Mobile-First**: Responsive design for all devices
- **Loading States**: Skeleton loaders and progress indicators

## 🚀 Deployment

### Vercel (Recommended)
ProdavajBrzo is optimized for Vercel deployment with automatic CI/CD:

1. **Connect Repository**: Import your GitHub repo to Vercel
2. **Environment Variables**: Add Supabase credentials in Vercel dashboard
3. **Auto-Deploy**: Every push to `master` triggers automatic deployment
4. **Live URL**: Get instant HTTPS URLs for preview and production

### Manual Deployment
For other platforms supporting Next.js:

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes and test thoroughly
5. **Commit** your changes: `git commit -m 'Add amazing feature'`
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Open** a Pull Request on GitHub

### Development Guidelines
- Follow TypeScript best practices
- Write descriptive commit messages
- Test your changes locally before pushing
- Ensure code passes linting: `npm run lint`

## 📊 Database Schema

The application uses three main tables in Supabase:

- **`user_profiles`**: Extended user information and preferences
- **`categories`**: Product categories for organization
- **`listings`**: Main product listings with seller, category, and status

Run `database-schema.sql` in your Supabase SQL editor to set up the database.

## 🐛 Troubleshooting

### Common Issues:
- **Build fails**: Check TypeScript errors with `npm run lint`
- **Images not loading**: Verify Supabase storage bucket permissions
- **Auth not working**: Confirm environment variables are set correctly
- **Maps not displaying**: Check Leaflet CSS imports

### Support:
- Check browser console for errors
- Verify Supabase project is active
- Ensure all environment variables are configured

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Next.js** - The React framework for production
- **Supabase** - Open source Firebase alternative
- **Shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Leaflet** - Interactive maps for the web

---

**Built with ❤️ using modern web technologies**
