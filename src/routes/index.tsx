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
    
    // If user is not admin, redirect to employee dashboard
    if (auth.user?.empRole !== 'admin') {
      throw redirect({
        to: '/employee-dashboard',
      })
    }
  },
  component: () => {
    return (
      <AuthenticatedLayout>
        <Dashboard />
      </AuthenticatedLayout>
    )
  },
})
