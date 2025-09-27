import Providers from '../providers'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {children}
      </main>
    </Providers>
  )
}


