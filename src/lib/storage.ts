import { supabase } from './supabase'

export async function uploadListingImage(file: File, listingId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${listingId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('listing-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('listing-images')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    throw new Error('Failed to upload image')
  }
}

export async function uploadListingImages(files: File[], listingId: string, defaultIndex: number = 0): Promise<{ url: string; isDefault: boolean; orderIndex: number }[]> {
  try {
    console.log(`Uploading ${files.length} images for listing ${listingId}`)

    const uploadPromises = files.map(async (file, index) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${listingId}/${Date.now()}_${index}.${fileExt}`

      console.log(`Uploading file ${index + 1}: ${fileName}`)

      const { data, error } = await supabase.storage
        .from('listing-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error(`Error uploading file ${index + 1}:`, error)
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(fileName)

      console.log(`File ${index + 1} uploaded successfully: ${publicUrl}`)

      return {
        url: publicUrl,
        isDefault: index === defaultIndex,
        orderIndex: index
      }
    })

    const results = await Promise.all(uploadPromises)
    console.log('All images uploaded successfully:', results)
    return results
  } catch (error) {
    console.error('Error uploading images:', error)
    throw new Error('Failed to upload images')
  }
}

export async function deleteListingImage(imageUrl: string): Promise<void> {
  try {
    // Extract file path from public URL
    const url = new URL(imageUrl)
    const path = url.pathname.split('/').slice(-2).join('/') // Get listingId/filename part

    const { error } = await supabase.storage
      .from('listing-images')
      .remove([path])

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error deleting image:', error)
    throw new Error('Failed to delete image')
  }
}

export function getImageUrl(path: string): string {
  const { data } = supabase.storage
    .from('listing-images')
    .getPublicUrl(path)

  return data.publicUrl
}