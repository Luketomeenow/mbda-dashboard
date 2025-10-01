import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id)
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const body = await request.json()

    const allowed: any = {}
    const maybe = (k: string) => {
      if (Object.prototype.hasOwnProperty.call(body, k)) allowed[k] = body[k]
    }

    // Allow editing of commonly displayed fields
    maybe('date')
    maybe('time')
    maybe('type')
    maybe('classification')
    maybe('location')
    maybe('municipality')
    maybe('district')
    maybe('barangay')
    maybe('vehicles_involved')
    maybe('vehicle_counts')
    maybe('narratives')
    maybe('sector')
    maybe('status_update')
    maybe('lanes_update')
    maybe('lanes_affected')
    maybe('team')
    maybe('toc_patrol')
    maybe('delta_1')
    maybe('tl')
    maybe('atl')
    maybe('roadwork_update')
    maybe('stranded_vehicle_report')
    maybe('accident_report')
    maybe('images')
    maybe('response_time')
    maybe('latitude')
    maybe('longitude')

    if (allowed.date) {
      const d = new Date(allowed.date)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
      }
      allowed.date = d
    }

    const updated = await prisma.traffic_incidents.update({ where: { id }, data: allowed })
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
}


