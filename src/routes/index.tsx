import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/authStore'

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
  component: AuthenticatedLayout,
})
