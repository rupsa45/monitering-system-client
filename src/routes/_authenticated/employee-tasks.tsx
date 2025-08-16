import { createFileRoute } from '@tanstack/react-router'
import EmployeeTasks from '@/features/tasks/components/employee-tasks'
import { Main } from '@/components/layout/main'

export const Route = createFileRoute('/_authenticated/employee-tasks')({
  component: () => (
    <Main>
      <EmployeeTasks />
    </Main>
  ),
})
