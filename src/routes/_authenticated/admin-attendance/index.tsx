import { createFileRoute } from '@tanstack/react-router'
import AdminAttendance from '@/features/attendance/admin-attendance'
import { Main } from '@/components/layout/main'

export const Route = createFileRoute('/_authenticated/admin-attendance/')({
  component: () => (
    <Main>
      <AdminAttendance />
    </Main>
  ),
}) 