import DashboardShell from '@/components/dashboard/DashboardShell'
import RecordsTable from '@/components/dashboard/RecordsTable'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardShell />
      <RecordsTable initialFilters={{ startDate: new Date(new Date().setMonth(new Date().getMonth()-1)).toISOString().slice(0,10), endDate: new Date().toISOString().slice(0,10), municipality: 'all', classification: 'all' }} />
    </div>
  )
}


