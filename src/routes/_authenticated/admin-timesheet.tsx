import { createFileRoute } from '@tanstack/react-router'
import AdminTimesheetAnalytics from '@/features/attendance/admin-timesheet-analytics'
import { Main } from '@/components/layout/main'

export const Route = createFileRoute('/_authenticated/admin-timesheet')({
  component: () => (
    <Main>
      <AdminTimesheetAnalytics />
    </Main>
  ),
})
