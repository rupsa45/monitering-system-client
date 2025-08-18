import { createFileRoute } from '@tanstack/react-router'
import AdminLeaveManagement from '@/features/leave/admin-leave-management'
import { AccessDenied } from '@/components/access-denied'
import { Main } from '@/components/layout/main'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/_authenticated/admin-leave-management')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()
    const isAdmin = auth.user?.empRole === 'admin'
    
    if (!isAdmin) {
      throw new Error('Access denied - Admin only')
    }
  },
  component: () => {
    const { auth } = useAuthStore.getState()
    const isAdmin = auth.user?.empRole === 'admin'
    
    if (!isAdmin) {
      return (
        <Main>
          <AccessDenied 
            title="Admin Access Only"
            message="This page is only available for administrators. Employees have access to the My Leave Management section."
            showHomeButton={true}
          />
        </Main>
      )
    }
    
    return (
      <Main>
        <AdminLeaveManagement />
      </Main>
    )
  },
})
