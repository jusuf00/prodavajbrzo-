'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useMapEvents } from 'react-leaflet'

// Dynamically import leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

// Create a client-side only component for the marker with events
const LocationMarkerComponent = dynamic(() => Promise.resolve(() => null), { ssr: false })

// Import geocoder for reverse geocoding
let geocoder: any = null
if (typeof window !== 'undefined') {
  import('leaflet-control-geocoder').then((mod) => {
    geocoder = new mod.default()
  }).catch(() => {
    // Fallback if geocoder fails to load
  })
}

// Dynamically import leaflet CSS and fix markers
if (typeof window !== 'undefined') {
  // @ts-expect-error
  import('leaflet/dist/leaflet.css')
  // @ts-expect-error
  import('leaflet-control-geocoder/dist/Control.Geocoder.css')

  // Fix for default markers in react-leaflet
  try {
    const { Icon } = require('leaflet')
    delete (Icon.Default.prototype as any)._getIconUrl
    Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })
  } catch (e) {
    // Ignore errors during SSR
  }
}

interface LocationMapProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void
  initialLat?: number
  initialLng?: number
}

function LocationMarker({ onLocationSelect, initialLat, initialLng }: LocationMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  )

  const map = useMapEvents({
    click(e: any) {
      const lat = e.latlng.lat
      const lng = e.latlng.lng
      setPosition([lat, lng])

      // Reverse geocode to get address
      if (geocoder && typeof geocoder.reverse === 'function') {
        geocoder.reverse({ lat, lng }, map.getZoom(), (results: any) => {
          if (results && results.length > 0) {
            const result = results[0]
            const address = result.name || `${result.properties?.address?.city || ''}, ${result.properties?.address?.country || ''}`.trim()
            onLocationSelect(lat, lng, address)
          } else {
            onLocationSelect(lat, lng)
          }
        })
      } else {
        // Fallback: use a simple fetch to Nominatim API
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
          .then(response => response.json())
          .then(data => {
            if (data && data.display_name) {
              onLocationSelect(lat, lng, data.display_name)
            } else {
              onLocationSelect(lat, lng)
            }
          })
          .catch(() => {
            onLocationSelect(lat, lng)
          })
      }
    },
  })

  useEffect(() => {
    if (initialLat && initialLng && !position) {
      setPosition([initialLat, initialLng])
      map.setView([initialLat, initialLng], 13)
    }
  }, [initialLat, initialLng, map, position])

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You selected this location</Popup>
    </Marker>
  )
}

export default function LocationMap({ onLocationSelect, initialLat, initialLng }: LocationMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])
          setIsGettingLocation(false)

          // Reverse geocode to get address
          if (geocoder && typeof geocoder.reverse === 'function') {
            geocoder.reverse({ lat: latitude, lng: longitude }, 13, (results: any) => {
              if (results && results.length > 0) {
                const result = results[0]
                const address = result.name || `${result.properties?.address?.city || ''}, ${result.properties?.address?.country || ''}`.trim()
                onLocationSelect(latitude, longitude, address)
              } else {
                onLocationSelect(latitude, longitude)
              }
            })
          } else {
            // Fallback: use a simple fetch to Nominatim API
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
              .then(response => response.json())
              .then(data => {
                if (data && data.display_name) {
                  onLocationSelect(latitude, longitude, data.display_name)
                } else {
                  onLocationSelect(latitude, longitude)
                }
              })
              .catch(() => {
                onLocationSelect(latitude, longitude)
              })
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          setIsGettingLocation(false)
          alert('Unable to get your location. Please allow location access or select manually on the map.')
        }
      )
    } else {
      alert('Geolocation is not supported by this browser.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isGettingLocation ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Getting Location...
            </>
          ) : (
            'Use My Current Location'
          )}
        </button>
      </div>

      <div className="h-64 border border-gray-200 rounded-lg shadow-sm overflow-hidden bg-gray-50" role="application" aria-label="Interactive map">
        <MapContainer
          center={userLocation || [41.9981, 21.4254]} // Default to Skopje, North Macedonia
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
          zoomControl={true}
          attributionControl={false}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          dragging={true}
          touchZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker
            onLocationSelect={onLocationSelect}
            initialLat={initialLat}
            initialLng={initialLng}
          />
        </MapContainer>
      </div>

      <p className="text-sm text-gray-600">
        Click on the map to select a location, or use "Use My Current Location" for automatic detection.
      </p>
    </div>
  )
}