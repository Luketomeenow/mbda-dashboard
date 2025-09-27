"use client"
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

type Filters = {
  startDate: string
  endDate: string
  municipality?: string | 'all'
  classification?: string | 'all'
  q?: string
}

async function fetchRecords(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v != null && sp.set(k, String(v)))
  const res = await fetch(`/api/records?${sp.toString()}`)
  if (!res.ok) throw new Error('Failed to load records')
  return res.json()
}

export default function RecordsTable({ initialFilters }: { initialFilters: Filters }) {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const { data, isLoading } = useQuery({ queryKey: ['records', page, filters], queryFn: () => fetchRecords({ page, pageSize: 20, ...filters }) })

  const paramsForExport = useMemo(() => {
    const sp = new URLSearchParams()
    Object.entries(filters).forEach(([k,v]) => v && sp.set(k, String(v)))
    return sp.toString()
  }, [filters])

  return (
    <div className="card p-0 overflow-hidden">
      <div className="card-header flex items-center justify-between">
        <div>All Records</div>
        <a className="rounded-md bg-brand-600 text-white px-3 py-1.5 text-sm" href={`/api/records/export?${paramsForExport}`} target="_blank">Export CSV</a>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
          <input placeholder="Search..." className="col-span-2 rounded-md border border-slate-300 px-3 py-2" value={filters.q ?? ''} onChange={(e) => { setPage(1); setFilters(f => ({ ...f, q: e.target.value })) }} />
          <select className="rounded-md border border-slate-300 px-3 py-2" value={filters.municipality ?? 'all'} onChange={(e)=>{ setPage(1); setFilters(f=>({ ...f, municipality: e.target.value })) }}>
            <option value="all">All Municipalities</option>
            {(data?.facets?.municipalities ?? []).map((m: any, i: number) => <option key={i} value={m}>{m}</option>)}
          </select>
          <select className="rounded-md border border-slate-300 px-3 py-2" value={filters.classification ?? 'all'} onChange={(e)=>{ setPage(1); setFilters(f=>({ ...f, classification: e.target.value })) }}>
            <option value="all">All Classifications</option>
            {(data?.facets?.classifications ?? []).map((c: any, i: number) => <option key={i} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Municipality</th>
                <th className="p-2 text-left">Classification</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Location</th>
                <th className="p-2 text-left">Vehicles</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-4" colSpan={6}>Loading…</td></tr>
              ) : (data?.rows ?? []).map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.date ? new Date(r.date).toLocaleDateString() : ''} {r.time ?? ''}</td>
                  <td className="p-2">{r.municipality}</td>
                  <td className="p-2">{r.classification}</td>
                  <td className="p-2">{r.type}</td>
                  <td className="p-2">{r.location}</td>
                  <td className="p-2">{r.vehicles_involved}</td>
                </tr>
              ))}
              {(!isLoading && (data?.rows ?? []).length === 0) && (
                <tr><td colSpan={6} className="p-4 text-slate-500">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <div>Page {data?.page ?? page} of {Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)))}</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded-md" disabled={(data?.page ?? page) <= 1} onClick={()=> setPage((p)=> Math.max(1, p-1))}>Prev</button>
            <button className="px-3 py-1 border rounded-md" disabled={((data?.page ?? page) * (data?.pageSize ?? 20)) >= (data?.total ?? 0)} onClick={()=> setPage((p)=> p+1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}


