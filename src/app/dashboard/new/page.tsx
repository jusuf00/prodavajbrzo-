'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/providers'
import { createListing, getCategories, createListingImages } from '@/lib/api'
import { uploadListingImages } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Save, Upload, X, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import LocationMap from '@/components/LocationMap'

export default function NewListingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    status: 'active' as 'draft' | 'active',
    location_lat: '',
    location_lng: '',
    location_address: '',
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [defaultImageIndex, setDefaultImageIndex] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    retry: 1,
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('Creating listing with data:', data)

      // Create listing first to get the ID
      const listing = await createListing({
        seller_id: user!.id,
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        category_id: data.category_id,
        status: data.status,
        location_lat: data.location_lat ? parseFloat(data.location_lat) : undefined,
        location_lng: data.location_lng ? parseFloat(data.location_lng) : undefined,
        location_address: data.location_address || undefined,
      })

      console.log('Listing created:', listing)

      // Upload images if provided
      if (imageFiles.length > 0) {
        console.log('Uploading images...')
        try {
          const uploadedImages = await uploadListingImages(imageFiles, listing.id, defaultImageIndex)
          console.log('Images uploaded:', uploadedImages)
          await createListingImages(listing.id, uploadedImages)
          console.log('Images linked to listing')
        } catch (error) {
          console.error('Image upload failed:', error)
          throw new Error('Failed to upload images')
        }
      }

      return listing
    },
    onSuccess: () => {
      console.log('Listing creation successful')
      queryClient.invalidateQueries({ queryKey: ['user-listings', user?.id] })
      toast.success('Listing created successfully')
      router.push('/dashboard')
    },
    onError: (error: any) => {
      console.error('Listing creation failed:', error)
      toast.error(error.message || 'Failed to create listing')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Description is required')
      return
    }

    if (!formData.price || isNaN(parseFloat(formData.price))) {
      toast.error('Valid price is required')
      return
    }

    if (!formData.category_id) {
      toast.error('Category is required')
      return
    }

    createMutation.mutate(formData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setFormData(prev => ({
      ...prev,
      location_lat: lat.toString(),
      location_lng: lng.toString(),
      location_address: address || '',
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const validFiles = files.filter(file => file.type.startsWith('image/')).slice(0, 5) // Limit to 5 images
      if (validFiles.length !== files.length) {
        toast.error('Only image files are allowed')
      }

      setIsUploading(true)
      setImageFiles(validFiles)

      const readers = validFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
      })

      Promise.all(readers).then((previews) => {
        setTimeout(() => {
          setImagePreviews(previews)
          setIsUploading(false)
        }, 1000)
      })
    }
  }

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImageFiles(newFiles)
    setImagePreviews(newPreviews)

    // Adjust default image index if necessary
    if (defaultImageIndex >= newFiles.length) {
      setDefaultImageIndex(Math.max(0, newFiles.length - 1))
    } else if (defaultImageIndex === index && index > 0) {
      setDefaultImageIndex(index - 1)
    }
  }

  const setDefaultImage = (index: number) => {
    setDefaultImageIndex(index)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 text-center">Create New Listing</h1>
          <p className="text-gray-600 mt-2 text-center">Fill in the details for your new product listing</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Listing Details</CardTitle>
            <CardDescription>
              Provide information about your product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter product title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
                placeholder="Describe your product"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category_id} onValueChange={(value) => handleChange('category_id', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="images" className="text-center">Product Images (Up to 5, Optional)</Label>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Images (Max 5)
                      </>
                    )}
                  </Button>
                </div>
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          width={150}
                          height={112}
                          className="rounded-lg object-cover w-full h-28"
                        />
                        <div className="absolute top-2 left-2 flex gap-1">
                          <Button
                            type="button"
                            variant={defaultImageIndex === index ? "default" : "secondary"}
                            size="sm"
                            className="rounded-full w-6 h-6 p-0"
                            onClick={() => setDefaultImage(index)}
                            title="Set as default"
                          >
                            <Star className={`h-3 w-3 ${defaultImageIndex === index ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              <Label htmlFor="location">Location (Optional)</Label>
              <LocationMap
                onLocationSelect={handleLocationSelect}
                initialLat={formData.location_lat ? parseFloat(formData.location_lat) : undefined}
                initialLng={formData.location_lng ? parseFloat(formData.location_lng) : undefined}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'draft' | 'active') => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (not visible to others)</SelectItem>
                  <SelectItem value="active">Active (visible to everyone)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  'Creating...'
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Listing
                  </>
                )}
              </Button>
              <Link href="/dashboard">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>
    )
  }