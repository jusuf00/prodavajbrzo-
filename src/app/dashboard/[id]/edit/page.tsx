'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/providers'
import { getUserListingById, updateListing, getCategories } from '@/lib/api'
import { uploadListingImages, deleteListingImage } from '@/lib/storage'
import { createListingImages } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Save, Upload, X, Trash2, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function EditListingPage() {
  const params = useParams()
  const listingId = params.id as string
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [defaultImageIndex, setDefaultImageIndex] = useState<number>(0)
  const [currentImages, setCurrentImages] = useState<any[]>([])

  // Fetch the listing to edit
  const { data: listing, isLoading } = useQuery({
    queryKey: ['user-listing', user?.id, listingId],
    queryFn: () => user ? getUserListingById(user.id, listingId) : Promise.reject('No user'),
    enabled: !!user && !!listingId,
  })

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  // Populate form when listing loads
  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title,
        description: listing.description,
        price: listing.price.toString(),
        category_id: listing.category_id,
      })
      setCurrentImages(listing.images || [])
      if (listing.images && listing.images.length > 0) {
        const defaultIndex = listing.images.findIndex(img => img.is_default)
        setDefaultImageIndex(defaultIndex >= 0 ? defaultIndex : 0)
      }
    }
  }, [listing])

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('Not authenticated')

      // Handle image changes
      if (imageFiles.length > 0) {
        // Delete old images if they exist
        if (currentImages.length > 0) {
          try {
            await Promise.all(currentImages.map(img => deleteListingImage(img.image_url)))
          } catch (error) {
            console.error('Error deleting old images:', error)
          }
        }

        // Upload new images
        try {
          const uploadedImages = await uploadListingImages(imageFiles, listingId, defaultImageIndex)
          await createListingImages(listingId, uploadedImages)
        } catch (error) {
          console.error('Error uploading images:', error)
          throw new Error('Failed to upload images')
        }
      } else if (imagePreviews.length === 0 && currentImages.length > 0) {
        // User removed all images
        try {
          await Promise.all(currentImages.map(img => deleteListingImage(img.image_url)))
        } catch (error) {
          console.error('Error deleting images:', error)
        }
      }

      // Update listing
      const updateData: any = {
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        category_id: data.category_id,
      }

      return updateListing(listingId, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-listings'] })
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      toast.success('Listing updated successfully')
      router.push('/dashboard')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update listing')
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

    updateMutation.mutate(formData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const validFiles = files.filter(file => file.type.startsWith('image/')).slice(0, 5) // Limit to 5 images
      if (validFiles.length !== files.length) {
        toast.error('Only image files are allowed')
      }

      setImageFiles(validFiles)

      const readers = validFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
      })

      Promise.all(readers).then((previews) => {
        setImagePreviews(previews)
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading listing...</div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
          <p className="text-gray-600 mb-4">The listing you're trying to edit doesn't exist or you don't have permission to edit it.</p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
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
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Edit Listing</h1>
            <p className="text-gray-600 mt-2">Update your listing details</p>
          </div>
        </div>

        <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Edit Listing Details</CardTitle>
          <CardDescription>
            Make changes to your listing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter product title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
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
                <Label htmlFor="price">Price</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="0.00"
                    className="pr-12"
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    ден
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category_id} onValueChange={(value) => handleChange('category_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
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
              <Label htmlFor="images">Product Images (Up to 5)</Label>
              <div className="space-y-4">
                {/* Current Images */}
                {currentImages.length > 0 && imagePreviews.length === 0 && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium">Current Images:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {currentImages.map((image, index) => (
                        <div key={image.id} className="relative">
                          <Image
                            src={image.image_url}
                            alt={`Current image ${index + 1}`}
                            width={150}
                            height={112}
                            className="rounded-lg object-contain bg-gray-50 w-full h-28"
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images Preview */}
                {imagePreviews.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium">New Images:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={preview}
                            alt={`New image ${index + 1}`}
                            width={150}
                            height={112}
                            className="rounded-lg object-contain bg-gray-50 w-full h-28"
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
                  </div>
                )}

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
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Images (Max 5)
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Upload new images to replace current ones. You can select multiple images and choose which one appears as default.
                </p>
              </div>
            </div>


            <div className="flex gap-4">
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  'Updating...'
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Listing
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