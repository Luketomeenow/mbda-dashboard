"use client"
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet'
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
          <Marker key={p.id} position={[p.latitude as number, p.longitude as number]} icon={icon}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{p.classification?.name ?? 'Incident'}</div>
                <div>{p.municipality?.name}</div>
                <div className="text-slate-500">{new Date(p.occurredAt).toLocaleString()}</div>
              </div>
            </Popup>
          </Marker>
        ))}
        {/* Density circles as a quick heatmap visual */}
        {clusterByMunicipality(valid).map(({ name, lat, lng, count }) => (
          <CircleMarker key={name} center={[lat, lng]} radius={Math.max(6, Math.min(24, count))} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.3 }} />
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


