import { createFileRoute } from '@tanstack/react-router'
import EmployeeLeaveManagement from '@/features/leave/employee-leave-management'
import { AccessDenied } from '@/components/access-denied'
import { Main } from '@/components/layout/main'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/_authenticated/employee-leave-management')({
  beforeLoad: () => {
    const { auth } = useAuthStore.getState()
    const isEmployee = auth.user?.empRole === 'employee'
    
    if (!isEmployee) {
      throw new Error('Access denied - Employee only')
    }
  },
  component: () => {
    const { auth } = useAuthStore.getState()
    const isEmployee = auth.user?.empRole === 'employee'
    
    if (!isEmployee) {
      return (
        <Main>
          <AccessDenied 
            title="Employee Access Only"
            message="This page is only available for employees. Administrators have access to the Admin Leave Management section."
            showHomeButton={true}
          />
        </Main>
      )
    }
    
    return (
      <Main>
        <EmployeeLeaveManagement />
      </Main>
    )
  },
})
