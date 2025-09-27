import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  const total = await prisma.traffic_incidents.count()
  const bounds = await prisma.traffic_incidents.aggregate({ _min: { date: true }, _max: { date: true } })
  const municipalities = await prisma.traffic_incidents.findMany({ select: { municipality: true }, distinct: ['municipality'], take: 20 })
  const classifications = await prisma.traffic_incidents.findMany({ select: { classification: true }, distinct: ['classification'], take: 20 })
  console.log({ total, bounds, municipalities: municipalities.map(m => m.municipality), classifications: classifications.map(c => c.classification) })
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })


