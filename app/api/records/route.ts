import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

function norm(v: string | null) { return (v ?? '').trim().toUpperCase() }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get('page') ?? '1')
  const pageSize = Math.min(Number(searchParams.get('pageSize') ?? '20'), 200)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const municipality = searchParams.get('municipality')
  const classification = searchParams.get('classification')
  const q = searchParams.get('q')

  const where: any = {}
  if (startDate || endDate) {
    where.date = {}
    if (startDate) where.date.gte = new Date(startDate)
    if (endDate) where.date.lte = new Date(endDate + 'T23:59:59')
  }
  if (municipality && municipality !== 'all') where.municipality = { equals: municipality, mode: 'insensitive' }
  if (classification && classification !== 'all') where.classification = { equals: classification, mode: 'insensitive' }
  if (q) where.OR = [
    { location: { contains: q, mode: 'insensitive' } },
    { vehicles_involved: { contains: q, mode: 'insensitive' } },
    { type: { contains: q, mode: 'insensitive' } },
  ]

  const [total, rows, distinctMunicipalities, distinctClassifications] = await Promise.all([
    prisma.traffic_incidents.count({ where }),
    prisma.traffic_incidents.findMany({ where, orderBy: { date: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.traffic_incidents.findMany({ select: { municipality: true }, distinct: ['municipality'] }),
    prisma.traffic_incidents.findMany({ select: { classification: true }, distinct: ['classification'] })
  ])

  const normalize = (s: string | null) => (s ?? '').trim().toUpperCase()
  const facets = {
    municipalities: Array.from(new Set(distinctMunicipalities.map((m: any) => normalize(m.municipality)))).filter(Boolean).sort(),
    classifications: Array.from(new Set(distinctClassifications.map((c: any) => normalize(c.classification)))).filter(Boolean).sort(),
  }

  return NextResponse.json({ total, page, pageSize, rows, facets })
}


