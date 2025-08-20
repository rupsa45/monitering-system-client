import { createFileRoute, redirect } from '@tanstack/react-router'
import EmployeeDashboard from '@/features/employee-dashboard'
import { useAuth } from '@/stores/authStore'

export const Route = createFileRoute('/_authenticated/employee-dashboard')({
  component: EmployeeDashboard,
  beforeLoad: () => {
    const { isEmployee, isAuthenticated } = useAuth()
    
    if (!isAuthenticated()) {
      throw redirect({
        to: '/login',
      })
    }
    
    if (!isEmployee()) {
      throw redirect({
        to: '/',
      })
    }
  },
})
