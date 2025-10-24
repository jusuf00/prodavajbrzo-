'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon, Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LocationDisplayMapProps {
  lat: number
  lng: number
  address?: string
}

export default function LocationDisplayMap({ lat, lng, address }: LocationDisplayMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="h-48 rounded-lg overflow-hidden border bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <div className="text-gray-600 font-medium">Loading map...</div>
          <div className="text-xs text-gray-400 mt-1">Please wait</div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
      </div>
    )
  }

  if (mapError) {
    return (
      <div className="h-48 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <div className="text-sm">Map unavailable</div>
          <div className="text-xs mt-1">
            {address || `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-48 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50" role="application" aria-label="Location map">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
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
        />
        <Marker position={[lat, lng]}>
          <Popup>
            {address || `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}