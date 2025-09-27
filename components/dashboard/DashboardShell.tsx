"use client"
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import Image from 'next/image'
import Logo from '@/lib/assets/mbda-logo.png.webp'

type Filters = {
  startDate: string
  endDate: string
  municipality?: string | 'all'
  classification?: string | 'all'
  year?: string | 'all'
}

async function fetchSummary(filters: Filters) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.set(k, String(v))
  })
  const res = await fetch(`/api/analytics?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to load analytics')
  return res.json()
}

export default function DashboardShell() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const monthAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 10)
  }, [])

  const [filters, setFilters] = useState<Filters>({ startDate: monthAgo, endDate: today, municipality: 'all', classification: 'all', year: 'all' })
  const { data, isLoading, refetch } = useQuery({ queryKey: ['analytics', filters], queryFn: () => fetchSummary(filters) })

  useEffect(() => { refetch() }, [refetch])

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Image src={Logo} alt="MBDA" className="h-14 w-14 rounded-xl shadow" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">MBDA Traffic Incidents Dashboard</h1>
            <p className="text-slate-500">Metro Bataan Development Authority – Traffic Analytics</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white px-8 py-6 text-center shadow-card">
            <div className="text-5xl font-bold">{data?.totals?.incidents ?? 0}</div>
            <div className="opacity-90">Total Incidents</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-white px-8 py-6 text-center shadow-card">
            <div className="text-5xl font-bold">{data?.totals?.today ?? 0}</div>
            <div className="opacity-90">Reported Today</div>
          </div>
        </div>
      </header>

      <section className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Start Date</label>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">End Date</label>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Year</label>
            <select value={filters.year as any} onChange={(e) => setFilters(f => ({ ...f, year: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="all">All</option>
              {(data?.filters?.years ?? []).map((y: number) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Municipality</label>
            <select value={filters.municipality as any} onChange={(e) => setFilters(f => ({ ...f, municipality: (e.target.value === 'all' ? 'all' : e.target.value) }))} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="all">All</option>
              {data?.filters?.municipalities?.map((m: any, i: number) => (
                <option value={m.name} key={i}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Classification</label>
            <select value={filters.classification as any} onChange={(e) => setFilters(f => ({ ...f, classification: (e.target.value === 'all' ? 'all' : e.target.value) }))} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="all">All</option>
              {['MINOR','MODERATE','MAJOR'].map((c) => (
                <option value={c} key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => refetch()} className="rounded-lg bg-brand-600 text-white px-4 py-2 hover:bg-brand-700">Apply Filters</button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-0 overflow-hidden">
          <div className="card-header">Incident Classification</div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data?.classification ?? []} margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-20} tick={{ fontSize: 12 }} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} />
                <RTooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-0 overflow-hidden">
          <div className="card-header">Municipality Distribution</div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data?.municipality ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-30} tick={{ fontSize: 12 }} textAnchor="end" height={90} />
                <YAxis allowDecimals={false} />
                <RTooltip />
                <Bar dataKey="count" fill="#0288c7" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-0 overflow-hidden">
          <div className="card-header">Vehicle Analysis</div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data?.vehicles ?? []} dataKey="count" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {(data?.vehicles ?? []).map((_: any, i: number) => (
                    <Cell key={i} fill={["#ef4444", "#0ea5e9", "#22c55e", "#a855f7", "#f59e0b", "#14b8a6", "#3b82f6"][i % 7]} />
                  ))}
                </Pie>
                <Legend />
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-sm">
              <table className="w-full border text-left">
                <thead className="bg-slate-100">
                  <tr><th className="p-2">Vehicle Type</th><th className="p-2">Count</th></tr>
                </thead>
                <tbody>
                  {(data?.vehicles ?? []).map((v: any) => (
                    <tr key={v.id} className="border-t"><td className="p-2">{v.name}</td><td className="p-2">{v.count}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="card p-0 overflow-hidden">
          <div className="card-header">Monthly Incident Trends</div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data?.trends ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <RTooltip />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-0 overflow-hidden">
          <div className="card-header">Incident Locations Map</div>
          <div className="p-6">
            <DynamicMap points={data?.points ?? []} />
          </div>
        </div>
        <div className="card p-0 overflow-hidden">
          <div className="card-header">Incident Density Heatmap</div>
          <div className="p-6 text-sm">
            <table className="w-full border text-left">
              <thead className="bg-slate-100">
                <tr><th className="p-2">Municipality</th><th className="p-2">Aug 2025</th></tr>
              </thead>
              <tbody>
                {(() => {
                  const monthKey = (s: string) => s
                  const counts: Record<string, number> = {}
                  ;(data?.points ?? []).forEach((p: any) => {
                    if (!p.municipality?.name || !p.occurredAt) return
                    const month = new Date(p.occurredAt).toISOString().slice(0,7)
                    if (month !== (data?.trends?.slice(-1)?.[0]?.month ?? month)) return
                    const key = p.municipality.name
                    counts[key] = (counts[key] ?? 0) + 1
                  })
                  const rows = Object.entries(counts).sort((a,b)=> b[1]-a[1])
                  return rows.map(([name, count]) => (
                    <tr key={name} className="border-t">
                      <td className="p-2">{name}</td>
                      <td className="p-2 font-semibold">{count}</td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

const DynamicMap = dynamic(() => import('./Map').then(m => m.default), { ssr: false })


