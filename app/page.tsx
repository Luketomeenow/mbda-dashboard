import Link from 'next/link'

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <header className="flex items-center gap-4 mb-10">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center text-white font-bold">MBDA</div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MBDA Traffic Incidents Dashboard</h1>
          <p className="text-slate-500">Metro Bataan Development Authority – Traffic Analytics</p>
        </div>
      </header>
      <div className="card p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Access</h2>
            <p className="text-slate-500 mt-1">Enter the PIN to open the analytics dashboard.</p>
          </div>
          <Link className="rounded-lg bg-brand-600 text-white px-4 py-2 hover:bg-brand-700" href="/pin">Enter PIN</Link>
        </div>
      </div>
    </main>
  )
}


