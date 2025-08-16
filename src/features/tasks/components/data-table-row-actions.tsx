import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { IconTrash, IconPower, IconEye, IconEyeOff } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTasks } from '../context/tasks-context'
import { labels } from '../data/data'
import { taskSchema } from '../data/schema'
import { useAuth } from '@/stores/authStore'
import { TaskService } from '@/services/taskService'
import { toast } from 'sonner'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  onTaskUpdated?: () => void
}

export function DataTableRowActions<TData>({
  row,
  onTaskUpdated,
}: DataTableRowActionsProps<TData>) {
  const task = taskSchema.parse(row.original)
  const { isAdmin, accessToken } = useAuth()
  const { setOpen, setCurrentRow } = useTasks()

  // If user is not admin, don't show any actions
  if (!isAdmin()) {
    return null
  }

  const handleDeactivate = async () => {
    if (!accessToken) {
      toast.error('Authentication required')
      return
    }

    try {
      const newActiveStatus = !task.isActive // Toggle the status
      const response = await TaskService.updateTaskStatus(accessToken, task.id, newActiveStatus)
      if (response.success) {
        toast.success(`Task ${newActiveStatus ? 'activated' : 'deactivated'} successfully`)
        onTaskUpdated?.()
      } else {
        toast.error(response.message || `Failed to ${newActiveStatus ? 'activate' : 'deactivate'} task`)
      }
    } catch (error) {
      console.error('Error toggling task status:', error)
      toast.error('Failed to update task status')
    }
  }

  const handleDelete = async () => {
    if (!accessToken) {
      toast.error('Authentication required')
      return
    }

    try {
      const response = await TaskService.deleteTask(accessToken, task.id)
      if (response.success) {
        toast.success('Task deleted successfully')
        onTaskUpdated?.()
      } else {
        toast.error(response.message || 'Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(task)
            setOpen('update')
          }}
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Make a copy</DropdownMenuItem>
        <DropdownMenuItem disabled>Favorite</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={task.label}>
              {labels.map((label) => (
                <DropdownMenuRadioItem key={label.value} value={label.value}>
                  {label.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        {task.isActive && (
          <DropdownMenuItem onClick={handleDeactivate}>
            <IconEyeOff className='mr-2 h-4 w-4' />
            Deactivate
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={handleDelete}
          className='text-red-600 focus:text-red-600'
        >
          <IconTrash className='mr-2 h-4 w-4' />
          Delete
          <DropdownMenuShortcut>
            <IconTrash size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
