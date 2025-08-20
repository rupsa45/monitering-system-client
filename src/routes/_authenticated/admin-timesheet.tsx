import { createFileRoute, redirect } from '@tanstack/react-router'
import AdminTimesheetAnalytics from '@/features/attendance/admin-timesheet-analytics'
import { Main } from '@/components/layout/main'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/_authenticated/admin-timesheet')({
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
      <AdminTimesheetAnalytics />
    </Main>
  ),
})
