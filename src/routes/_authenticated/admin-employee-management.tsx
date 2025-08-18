import { createFileRoute, redirect } from '@tanstack/react-router'
import AdminEmployeeManagement from '@/features/admin-employee-management'
import { useAuth, useAuthStore } from '@/stores/authStore'
import { AccessDenied } from '@/components/access-denied'

export const Route = createFileRoute('/_authenticated/admin-employee-management')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()
    
    // If user is not authenticated, redirect to login
    if (!auth.accessToken) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: () => {
    const { user } = useAuth()
    
    // If user is not admin, show denied message
    if (user?.empRole !== 'admin') {
      return <AccessDenied 
        title="Employee Management Access Denied"
        message="Employee management is only available for administrators."
      />
    }
    
    // Show employee management for admin users
    return <AdminEmployeeManagement />
  },
})
