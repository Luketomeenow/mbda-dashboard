"use client"
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

  const queryClient = useQueryClient()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<any>({})

  function openEdit(r: any) {
    setEditId(r.id)
    setEditValues({
      date: r.date ? new Date(r.date).toISOString().slice(0,10) : '',
      time: r.time ?? '',
      municipality: r.municipality ?? '',
      classification: r.classification ?? '',
      type: r.type ?? '',
      location: r.location ?? '',
      vehicles_involved: r.vehicles_involved ?? ''
    })
    setIsEditOpen(true)
  }

  function setField(key: string, value: any) {
    setEditValues((prev: any) => ({ ...prev, [key]: value }))
  }

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: any }) => {
      const res = await fetch(`/api/records/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      if (!res.ok) throw new Error('Failed to update record')
      return res.json()
    },
    onSuccess: () => {
      setIsEditOpen(false)
      setEditId(null)
      queryClient.invalidateQueries({ queryKey: ['records'] })
    }
  })

  function handleSave() {
    if (editId == null) return
    updateMutation.mutate({ id: editId, values: editValues })
  }

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
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="p-4" colSpan={7}>Loading…</td></tr>
              ) : (data?.rows ?? []).map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.date ? new Date(r.date).toLocaleDateString() : ''} {r.time ?? ''}</td>
                  <td className="p-2">{r.municipality}</td>
                  <td className="p-2">{r.classification}</td>
                  <td className="p-2">{r.type}</td>
                  <td className="p-2">{r.location}</td>
                  <td className="p-2">{r.vehicles_involved}</td>
                  <td className="p-2">
                    <button className="px-2 py-1 border rounded-md" onClick={() => openEdit(r)}>Edit</button>
                  </td>
                </tr>
              ))}
              {(!isLoading && (data?.rows ?? []).length === 0) && (
                <tr><td colSpan={7} className="p-4 text-slate-500">No records found.</td></tr>
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
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Edit Record</div>
              <button className="text-slate-600" onClick={() => setIsEditOpen(false)}>✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600">Date</span>
                <input type="date" className="rounded-md border border-slate-300 px-3 py-2" value={editValues.date ?? ''} onChange={(e)=> setField('date', e.target.value)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600">Time</span>
                <input type="time" className="rounded-md border border-slate-300 px-3 py-2" value={editValues.time ?? ''} onChange={(e)=> setField('time', e.target.value)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600">Municipality</span>
                <input className="rounded-md border border-slate-300 px-3 py-2" value={editValues.municipality ?? ''} onChange={(e)=> setField('municipality', e.target.value)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-600">Classification</span>
                <input className="rounded-md border border-slate-300 px-3 py-2" value={editValues.classification ?? ''} onChange={(e)=> setField('classification', e.target.value)} />
              </label>
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-sm text-slate-600">Type</span>
                <input className="rounded-md border border-slate-300 px-3 py-2" value={editValues.type ?? ''} onChange={(e)=> setField('type', e.target.value)} />
              </label>
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-sm text-slate-600">Location</span>
                <input className="rounded-md border border-slate-300 px-3 py-2" value={editValues.location ?? ''} onChange={(e)=> setField('location', e.target.value)} />
              </label>
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-sm text-slate-600">Vehicles Involved</span>
                <input className="rounded-md border border-slate-300 px-3 py-2" value={editValues.vehicles_involved ?? ''} onChange={(e)=> setField('vehicles_involved', e.target.value)} />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button className="px-3 py-1 border rounded-md" onClick={() => setIsEditOpen(false)} disabled={updateMutation.isLoading}>Cancel</button>
              <button className="px-3 py-1 rounded-md bg-brand-600 text-white disabled:opacity-50" onClick={handleSave} disabled={updateMutation.isLoading}>{updateMutation.isLoading ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


