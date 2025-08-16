import { createFileRoute } from '@tanstack/react-router'
import UserAttendance from '@/features/attendance/user-attendance'
import { Main } from '@/components/layout/main'

export const Route = createFileRoute('/_authenticated/user-attendance/')({
  component: () => (
    <Main>
      <UserAttendance />
    </Main>
  ),
}) 