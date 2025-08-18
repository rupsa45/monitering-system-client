import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuth, useAuthStore } from '@/stores/authStore'
import Dashboard from '@/features/dashboard'
import { AccessDenied } from '@/components/access-denied'

export const Route = createFileRoute('/')({
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
      return (
        <AuthenticatedLayout>
          <AccessDenied 
            title="Dashboard Access Denied"
            message="This dashboard is only available for administrators."
          />
        </AuthenticatedLayout>
      )
    }
    
    // Show admin dashboard for admin users
    return (
      <AuthenticatedLayout>
        <Dashboard />
      </AuthenticatedLayout>
    )
  },
})
