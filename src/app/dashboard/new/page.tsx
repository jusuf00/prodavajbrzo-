'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/providers'
import { createListing, getAllCategories, createListingImages } from '@/lib/api'
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
import { useTranslations } from 'next-intl'

export default function NewListingPage() {
  const t = useTranslations('newListing')
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
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
    queryFn: getAllCategories,
    retry: 1,
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log('🔄 Starting listing creation with data:', data)

      try {
        // Validate required fields
        console.log('🔍 Validating fields...')
        if (!data.title?.trim()) {
          console.error('❌ Title validation failed')
          throw new Error('Title is required')
        }
        if (!data.description?.trim()) {
          console.error('❌ Description validation failed')
          throw new Error('Description is required')
        }
        if (!data.price || isNaN(parseFloat(data.price))) {
          console.error('❌ Price validation failed:', data.price)
          throw new Error('Valid price is required')
        }
        if (!data.category_id) {
          console.error('❌ Category validation failed')
          throw new Error('Category is required')
        }
        console.log('✅ Validation passed')

        // Create listing first to get the ID
        console.log('📝 Creating listing in database...')
        const listing = await createListing({
          seller_id: user!.id,
          title: data.title.trim(),
          description: data.description.trim(),
          price: parseFloat(data.price),
          category_id: data.category_id,
          location_lat: data.location_lat ? parseFloat(data.location_lat) : undefined,
          location_lng: data.location_lng ? parseFloat(data.location_lng) : undefined,
          location_address: data.location_address?.trim() || undefined,
        })
        console.log('✅ Listing created:', listing)

        // Upload images if provided
        if (imageFiles.length > 0) {
          console.log('🖼️ Uploading', imageFiles.length, 'images...')
          try {
            const uploadedImages = await uploadListingImages(imageFiles, listing.id, defaultImageIndex)
            console.log('✅ Images uploaded:', uploadedImages)
            await createListingImages(listing.id, uploadedImages)
            console.log('✅ Images linked to listing')
          } catch (error) {
            console.error('❌ Image upload failed:', error)
            throw new Error('Failed to upload images')
          }
        } else {
          console.log('ℹ️ No images to upload')
        }

        console.log('🎉 Listing creation completed successfully')
        return listing
      } catch (error) {
        console.error('💥 Error in listing creation:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      console.log('🎯 Mutation onSuccess called with:', data)
      queryClient.invalidateQueries({ queryKey: ['user-listings', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      toast.success('Listing created successfully')
      router.push('/dashboard')
    },
    onError: (error: any) => {
      console.error('🚨 Mutation onError called:', error)
      toast.error(error.message || 'Failed to create listing')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('📋 Form submitted with data:', formData)
    console.log('🔄 Starting mutation...')
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-8">
      <div className="w-full max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToDashboard')}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">{t('title')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2 text-center">{t('subtitle')}</p>
        </div>

        <Card className="shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('listingDetails')}</CardTitle>
            <CardDescription>
              {t('provideInfo')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t('titleLabel')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Enter product title"
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  required
                />
              </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('descriptionLabel')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
                placeholder="Describe your product"
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t('priceLabel')}</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    placeholder="0.00"
                    className="pr-12 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    required
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                    ден
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t('categoryLabel')}</Label>
                <Select value={formData.category_id} onValueChange={(value) => handleChange('category_id', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" className="text-gray-900 dark:text-white" />
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
              <Label htmlFor="images" className="text-center">{t('productImages')}</Label>
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
                        <div className="loading-spinner mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        {t('uploading')}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {t('uploadImages')}
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
              <Label htmlFor="location">Location</Label>
              <LocationMap
                onLocationSelect={handleLocationSelect}
                initialLat={formData.location_lat ? parseFloat(formData.location_lat) : undefined}
                initialLng={formData.location_lng ? parseFloat(formData.location_lng) : undefined}
              />
            </div>


            <div className="flex gap-4">
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  t('creating')
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('createListing')}
                  </>
                )}
              </Button>
              <Link href="/dashboard">
                <Button type="button" variant="outline">
                  {t('cancel')}
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