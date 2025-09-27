import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const municipality = searchParams.get('municipality')
  const classification = searchParams.get('classification')

  const where: any = {}
  if (startDate || endDate) {
    where.date = {}
    if (startDate) where.date.gte = new Date(startDate)
    if (endDate) where.date.lte = new Date(endDate + 'T23:59:59')
  }
  if (municipality && municipality !== 'all') where.municipality = { equals: municipality, mode: 'insensitive' }
  if (classification && classification !== 'all') where.classification = { equals: classification, mode: 'insensitive' }

  const rows = await prisma.traffic_incidents.findMany({ where, orderBy: { date: 'desc' }, take: 5000 })

  // CSV export (Excel friendly)
  const headers = [
    'id','date','time','type','classification','location','municipality','district','barangay','vehicles_involved','vehicle_counts','narratives','sector','status_update','lanes_update','lanes_affected','team','toc_patrol','delta_1','tl','atl','roadwork_update','stranded_vehicle_report','accident_report','created_at','updated_at','images','response_time','latitude','longitude'
  ]
  const csv = [headers.join(',')].concat(
    rows.map((r: any) => headers.map((h) => formatCsv(r[h as keyof typeof r] as any)).join(','))
  ).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="traffic_incidents_export.csv"`
    }
  })
}

function formatCsv(v: any) {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString()
  const s = String(v).replace(/"/g, '""')
  if (/[",\n]/.test(s)) return `"${s}` + `"`
  return s
}


