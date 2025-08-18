import { createFileRoute } from '@tanstack/react-router'
import AdminEmployeeManagement from '@/features/admin-employee-management'

export const Route = createFileRoute('/_authenticated/admin-employee-management')({
  component: AdminEmployeeManagement,
})
