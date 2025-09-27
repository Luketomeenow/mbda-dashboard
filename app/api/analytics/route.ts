import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const year = searchParams.get('year')
  const municipality = searchParams.get('municipality')
  const classification = searchParams.get('classification')

  const where: any = {}
  if (year && year !== 'all') {
    const y = Number(year)
    where.date = { gte: new Date(`${y}-01-01`), lte: new Date(`${y}-12-31T23:59:59`) }
  } else if (startDate || endDate) {
    where.date = {}
    if (startDate) where.date.gte = new Date(startDate)
    if (endDate) where.date.lte = new Date(endDate + 'T23:59:59')
  }
  if (municipality && municipality !== 'all') where.municipality = municipality
  if (classification && classification !== 'all') where.classification = classification

  const startOfToday = new Date(); startOfToday.setHours(0,0,0,0)
  const endOfToday = new Date(); endOfToday.setHours(23,59,59,999)

  const [incidentsCount, todayCount, classificationAgg, municipalityAgg, monthly, points, distinctMunicipalities, distinctClassifications, vehicleCounts, bounds] = await Promise.all([
    prisma.traffic_incidents.count({ where }),
    prisma.traffic_incidents.count({ where: { ...(where || {}), date: { gte: startOfToday, lte: endOfToday } } }),
    prisma.traffic_incidents.groupBy({ by: ['classification'], _count: { _all: true }, where }),
    prisma.traffic_incidents.groupBy({ by: ['municipality'], _count: { _all: true }, where }),
    prisma.$queryRawUnsafe<any[]>(
      `SELECT to_char(date_trunc('month', "date"), 'YYYY-MM') as month, count(*)::int as count
       FROM "traffic_incidents"
       WHERE ($1::timestamp IS NULL OR "date" >= $1) AND ($2::timestamp IS NULL OR "date" <= $2)
       AND ($3::text IS NULL OR municipality = $3)
       AND ($4::text IS NULL OR classification = $4)
       GROUP BY 1 ORDER BY 1`,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate + 'T23:59:59') : null,
      municipality && municipality !== 'all' ? municipality : null,
      classification && classification !== 'all' ? classification : null,
    ),
    prisma.traffic_incidents.findMany({
      where,
      select: { id: true, latitude: true, longitude: true, municipality: true, classification: true, date: true },
      take: 500,
      orderBy: { date: 'desc' },
    }),
    prisma.traffic_incidents.findMany({ select: { municipality: true }, distinct: ['municipality'] }),
    prisma.traffic_incidents.findMany({ select: { classification: true }, distinct: ['classification'] }),
    Promise.all([
      prisma.traffic_incidents.count({ where: { ...where, vehicles_involved: { contains: 'SINGLE MOTORCYCLE', mode: 'insensitive' } } }),
      prisma.traffic_incidents.count({ where: { ...where, vehicles_involved: { contains: 'TRICYCLE', mode: 'insensitive' } } }),
      prisma.traffic_incidents.count({ where: { ...where, vehicles_involved: { contains: 'PUV', mode: 'insensitive' } } }),
      prisma.traffic_incidents.count({ where: { ...where, vehicles_involved: { contains: 'PRIVATE', mode: 'insensitive' } } }),
      prisma.traffic_incidents.count({ where: { ...where, vehicles_involved: { contains: 'TRUCK', mode: 'insensitive' } } }),
      prisma.traffic_incidents.count({ where: { ...where, vehicles_involved: { contains: 'JEEP', mode: 'insensitive' } } }),
      prisma.traffic_incidents.count({ where: { ...where, vehicles_involved: { contains: 'BICYCLE', mode: 'insensitive' } } }),
    ]),
    prisma.traffic_incidents.aggregate({ _min: { date: true }, _max: { date: true } }),
  ])

  const normalize = (s: string | null) => (s ?? '').trim().toUpperCase()

  const classificationData = Object.values(
    classificationAgg.reduce((acc: any, row) => {
      const key = normalize(row.classification as string | null)
      if (!key) return acc
      acc[key] = acc[key] || { id: key, name: key, count: 0 }
      acc[key].count += row._count._all
      return acc
    }, {})
  )

  const municipalityData = Object.values(
    municipalityAgg.reduce((acc: any, row) => {
      const key = normalize(row.municipality as string | null)
      if (!key) return acc
      acc[key] = acc[key] || { id: key, name: key, count: 0 }
      acc[key].count += row._count._all
      return acc
    }, {})
  )

  const vehicles = [
    { id: 'SINGLE MOTORCYCLE', name: 'SINGLE MOTORCYCLE', count: vehicleCounts[0] ?? 0 },
    { id: 'TRICYCLE', name: 'TRICYCLE', count: vehicleCounts[1] ?? 0 },
    { id: 'PUV', name: 'PUV', count: vehicleCounts[2] ?? 0 },
    { id: 'PRIVATE VEHICLE', name: 'PRIVATE VEHICLE', count: vehicleCounts[3] ?? 0 },
    { id: 'TRUCK', name: 'TRUCK', count: vehicleCounts[4] ?? 0 },
    { id: 'JEEPNEY', name: 'JEEPNEY', count: vehicleCounts[5] ?? 0 },
    { id: 'BICYCLE', name: 'BICYCLE', count: vehicleCounts[6] ?? 0 },
  ]

  const filters = {
    municipalities: Array.from(new Set(
      distinctMunicipalities.map((m: any) => normalize(m.municipality))
    )).filter(Boolean).sort().map((name: string) => ({ id: name, name })),
    classifications: Array.from(new Set(
      distinctClassifications.map((c: any) => normalize(c.classification))
    )).filter(Boolean).sort().map((name: string) => ({ id: name, name })),
    years: (() => {
      const min = bounds._min.date ? new Date(bounds._min.date).getFullYear() : new Date().getFullYear()
      const max = bounds._max.date ? new Date(bounds._max.date).getFullYear() : new Date().getFullYear()
      const arr: number[] = []
      for (let y = max; y >= min; y--) arr.push(y)
      return arr
    })(),
  }

  return NextResponse.json({
    totals: { incidents: incidentsCount, today: todayCount },
    filters,
    classification: classificationData,
    municipality: municipalityData,
    vehicles,
    trends: monthly,
    points: points.map((p: any) => ({ id: p.id, latitude: p.latitude, longitude: p.longitude, municipality: { name: p.municipality }, classification: { name: p.classification }, occurredAt: p.date })),
  })
}


