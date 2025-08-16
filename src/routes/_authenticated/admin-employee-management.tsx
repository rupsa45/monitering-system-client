import { createFileRoute, redirect } from '@tanstack/react-router'
import AdminEmployeeManagement from '@/features/admin-employee-management'
import { useAuth } from '@/stores/authStore'

export const Route = createFileRoute('/_authenticated/admin-employee-management')({
  component: AdminEmployeeManagement,
  beforeLoad: () => {
    const { isAdmin, isAuthenticated } = useAuth()
    
    if (!isAuthenticated()) {
      throw redirect({
        to: '/login',
      })
    }
    
    if (!isAdmin()) {
      throw redirect({
        to: '/employee-dashboard',
      })
    }
  },
})
