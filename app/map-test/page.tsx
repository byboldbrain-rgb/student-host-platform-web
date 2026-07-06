'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

export default function MapTestPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

    if (!token) {
      console.error('Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN')
      return
    }

    mapboxgl.accessToken = token

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [31.1837, 27.1809], // Assiut: [longitude, latitude]
      zoom: 13,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    new mapboxgl.Marker()
      .setLngLat([31.1837, 27.1809])
      .setPopup(new mapboxgl.Popup().setText('Navienty map test'))
      .addTo(mapRef.current)

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <main style={{ width: '100vw', height: '100vh' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </main>
  )
}