"use client"
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

const PIN = '10102020'

function PinInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (value === PIN) {
      document.cookie = `mbda_pin_ok=1; path=/; max-age=${60 * 60 * 8}`
      const redirect = params.get('redirect') || '/dashboard'
      router.replace(redirect)
    } else {
      setError('Invalid PIN. Please try again.')
    }
  }

  return (
    <main className="min-h-[70vh] grid place-items-center px-6">
      <form onSubmit={submit} className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold mb-2">Enter Access PIN</h1>
        <p className="text-slate-500 mb-6">Only authorized users can access the analytics.</p>
        <input
          type="password"
          inputMode="numeric"
          placeholder="••••••••"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <button type="submit" className="mt-6 w-full rounded-lg bg-brand-600 text-white py-3 font-medium hover:bg-brand-700">Unlock</button>
      </form>
    </main>
  )
}

export default function PinPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] grid place-items-center">Loading…</div>}>
      <PinInner />
    </Suspense>
  )
}


