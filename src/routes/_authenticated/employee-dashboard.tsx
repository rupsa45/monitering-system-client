import { createFileRoute, redirect } from '@tanstack/react-router'
import EmployeeDashboard from '@/features/employee-dashboard'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/_authenticated/employee-dashboard')({
  component: EmployeeDashboard,
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()
    
    if (!auth.accessToken) {
      throw redirect({
        to: '/login',
      })
    }
    
    if (auth.user?.empRole !== 'employee') {
      throw redirect({
        to: '/',
      })
    }
  },
})
