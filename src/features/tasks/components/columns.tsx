import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { format } from 'date-fns'
// Force refresh - priorities removed
import { labels, statuses } from '../data/data'
import { Task } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

export function createColumns(onTaskUpdated?: () => void): ColumnDef<Task>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
          className='translate-y-[2px]'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
          className='translate-y-[2px]'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Title' />
      ),
      cell: ({ row }) => {
        const label = labels.find((label) => label.value === row.original.label)
        const isActive = row.original.isActive

        return (
          <div className={`flex space-x-2 ${!isActive ? 'opacity-60' : ''}`}>
            {label && <Badge variant='outline'>{label.label}</Badge>}
            <span className={`max-w-32 truncate font-medium sm:max-w-72 md:max-w-[31rem] ${!isActive ? 'text-muted-foreground' : ''}`}>
              {row.getValue('title')}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Description' />
      ),
      cell: ({ row }) => {
        const description = row.getValue('description') as string
        
        if (!description) {
          return <span className='text-muted-foreground'>No description</span>
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className='max-w-[200px] cursor-help'>
                  <span className='text-sm text-muted-foreground line-clamp-1'>
                    {description}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className='max-w-[400px]'>
                <p className='text-sm'>{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
      filterFn: (row, id, value) => {
        const description = row.getValue(id) as string
        if (!description) return false
        return description.toLowerCase().includes(value.toLowerCase())
      },
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Active Status' />
      ),
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean
        
        return (
          <div className='flex items-center'>
            <div className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        const isActive = row.getValue(id) as boolean
        return value.includes(isActive ? 'active' : 'inactive')
      },
    },
    {
      accessorKey: 'assignee',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Assignee' />
      ),
      cell: ({ row }) => {
        const assigneeName = row.original.assigneeName
        const assigneeEmail = row.original.assigneeEmail
        
        if (!assigneeName) {
          return <span className='text-muted-foreground'>Unassigned</span>
        }

        return (
          <div className='flex items-center space-x-2'>
            <Avatar className='h-6 w-6'>
              <AvatarImage src="" alt={assigneeName} />
              <AvatarFallback className='text-xs'>
                {assigneeName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-col'>
              <span className='text-sm font-medium'>{assigneeName}</span>
              {assigneeEmail && (
                <span className='text-xs text-muted-foreground'>{assigneeEmail}</span>
              )}
            </div>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Task Status' />
      ),
      cell: ({ row }) => {
        const status = statuses.find(
          (status) => status.value === row.getValue('status')
        )

        if (!status) {
          return null
        }

        return (
          <div className='flex w-[100px] items-center'>
            {status.icon && (
              <status.icon className='text-muted-foreground mr-2 h-4 w-4' />
            )}
            <span>{status.label}</span>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'dueDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Due Date' />
      ),
      cell: ({ row }) => {
        const dueDate = row.original.dueDate
        if (!dueDate) {
          return <span className='text-muted-foreground'>No due date</span>
        }
        
        const dueDateObj = new Date(dueDate)
        const today = new Date()
        const isOverdue = dueDateObj < today
        
        return (
          <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
            {format(dueDateObj, 'MM/dd/yyyy')}
            {isOverdue && ' (Overdue)'}
          </span>
        )
      },
      filterFn: (row, id, value) => {
        const dueDate = row.getValue(id) as string
        if (!dueDate) return false
        return dueDate.toLowerCase().includes(value.toLowerCase())
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => <DataTableRowActions row={row} onTaskUpdated={onTaskUpdated} />,
    },
  ]
}
