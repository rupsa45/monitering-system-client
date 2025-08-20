import { createFileRoute, redirect } from '@tanstack/react-router'
import AdminAttendance from '@/features/attendance/admin-attendance'
import { Main } from '@/components/layout/main'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/_authenticated/admin-attendance/')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()
    
    // If user is not admin, redirect to employee dashboard
    if (auth.user?.empRole !== 'admin') {
      throw redirect({
        to: '/employee-dashboard',
      })
    }
  },
  component: () => (
    <Main>
      <AdminAttendance />
    </Main>
  ),
}) 