"use client"
import { MapContainer, TileLayer, Popup, useMap, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

type Point = { id: number; latitude: number | null; longitude: number | null; municipality?: { name: string }; classification?: { name: string }; occurredAt: string }

export default function Map({ points }: { points: Point[] }) {
  const defaultCenter: [number, number] = [14.676, 120.54] // Bataan vicinity
  const isValid = (p: Point): p is Required<Point> => p.latitude != null && p.longitude != null
  const valid = points.filter(isValid)
  return (
    <div className="h-[420px] w-full">
      <MapContainer center={defaultCenter} zoom={9} className="h-full w-full" scrollWheelZoom={true}>
        <ResizeHandler points={valid} />
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {valid.map(p => (
          <CircleMarker
            key={p.id}
            center={[p.latitude as number, p.longitude as number]}
            radius={6}
            pathOptions={{ color: colorForClass(p.classification?.name), fillColor: colorForClass(p.classification?.name), fillOpacity: 0.85 }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{p.classification?.name ?? 'Incident'}</div>
                <div>{p.municipality?.name}</div>
                <div className="text-slate-500">{new Date(p.occurredAt).toLocaleString()}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}

function ResizeHandler({ points }: { points: Required<Point>[] }) {
  const map = useMap()
  useEffect(() => {
    const fix = () => {
      map.invalidateSize()
      if (points.length) {
        const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude] as [number, number]))
        map.fitBounds(bounds.pad(0.2))
      }
    }
    const id = setTimeout(fix, 0)
    window.addEventListener('resize', fix)
    return () => { clearTimeout(id); window.removeEventListener('resize', fix) }
  }, [map, points])
  return null
}

function clusterByMunicipality(points: Required<Point>[]) {
  const centerByName: Record<string, { lat: number; lng: number; count: number }> = {}
  for (const p of points) {
    const name = p.municipality?.name || 'Unknown'
    if (!centerByName[name]) centerByName[name] = { lat: p.latitude as number, lng: p.longitude as number, count: 0 }
    centerByName[name].count += 1
  }
  return Object.entries(centerByName).map(([name, v]) => ({ name, ...v }))
}

function colorForClass(name?: string) {
  const key = (name ?? '').toUpperCase()
  if (key.includes('MINOR')) return '#22c55e'
  if (key.includes('MODERATE')) return '#f59e0b'
  if (key.includes('MAJOR')) return '#ef4444'
  // fallback cycle
  return '#3b82f6'
}


