import { createFileRoute, redirect } from '@tanstack/react-router'
import UserAttendance from '@/features/attendance/user-attendance'
import { Main } from '@/components/layout/main'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/_authenticated/user-attendance/')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()
    
    // If user is not employee, redirect to admin dashboard
    if (auth.user?.empRole !== 'employee') {
      throw redirect({
        to: '/',
      })
    }
  },
  component: () => (
    <Main>
      <UserAttendance />
    </Main>
  ),
}) 