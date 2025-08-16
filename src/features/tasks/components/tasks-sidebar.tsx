import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { X, Check, Users } from 'lucide-react'
import { useAuth } from '@/stores/authStore'
import { TaskService, Employee } from '@/services/taskService'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated?: () => void
}

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required.'),
})

type TaskForm = z.infer<typeof formSchema>

export function TasksSidebar({ open, onOpenChange, onTaskCreated }: Props) {
  const { accessToken } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

  const form = useForm<TaskForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
    },
  })

  // Fetch employees when sidebar opens
  useEffect(() => {
    if (open && accessToken) {
      fetchEmployees()
    }
  }, [open, accessToken])

  const fetchEmployees = async () => {
    if (!accessToken) {
      console.log('TasksSidebar - No access token available')
      return
    }
    
    console.log('TasksSidebar - Starting to fetch employees...')
    setLoadingEmployees(true)
    try {
      const response = await TaskService.getEmployees(accessToken)
      console.log('TasksSidebar - API Response:', response)
      
      if (response.success && response.empData) {
        setEmployees(response.empData)
        console.log('TasksSidebar - Successfully loaded employees:', response.empData)
      } else {
        console.log('TasksSidebar - API returned success: false or no empData')
        toast.error('Failed to load employees')
      }
    } catch (error) {
      console.error('TasksSidebar - Error fetching employees:', error)
      toast.error('Failed to load employees')
    } finally {
      setLoadingEmployees(false)
    }
  }

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const onSubmit = async (data: TaskForm) => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee to assign the task to')
      return
    }

    // Validate that the due date is in the future
    const selectedDate = new Date(data.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to start of today
    
    if (selectedDate < today) {
      toast.error('Due date must be in the future')
      return
    }

    try {
      // Convert date to ISO string format for backend
      // Set the time to end of day (23:59:59) to ensure it's considered "in the future"
      selectedDate.setHours(23, 59, 59, 999) // Set to end of day
      const dueDate = selectedDate.toISOString()
      
      const taskData = {
        title: data.title,
        description: data.description || '',
        assignedTo: selectedEmployees,
        dueDate: dueDate,
      }

      console.log('Creating task with data:', taskData)
      console.log('Selected date:', data.dueDate)
      console.log('Formatted due date:', dueDate)
      
      if (!accessToken) {
        toast.error('Authentication required')
        return
      }

      const response = await TaskService.createTask(accessToken, taskData)
      
      if (response.success) {
        toast.success('Task created successfully!')
        onOpenChange(false)
        form.reset()
        setSelectedEmployees([])
        onTaskCreated?.()
      } else {
        toast.error(response.message || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Task</SheetTitle>
          <SheetDescription>
            Create a new task and assign it to team members. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter task title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter task description..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          min={new Date().toISOString().split('T')[0]} // Set minimum to today
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <FormLabel className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assign to Employees *
                </FormLabel>
                
                {loadingEmployees ? (
                  <div className="text-sm text-muted-foreground">Loading employees...</div>
                ) : employees.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {employees.map((employee) => (
                      <div
                        key={employee.id}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                          selectedEmployees.includes(employee.id)
                            ? 'bg-primary/10 border border-primary/20'
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                        onClick={() => toggleEmployee(employee.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedEmployees.includes(employee.id)
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground'
                          }`}>
                            {selectedEmployees.includes(employee.id) && (
                              <Check className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{employee.empName}</div>
                            <div className="text-xs text-muted-foreground">{employee.empEmail}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No employees available</div>
                )}

                {selectedEmployees.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Selected Employees:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployees.map((employeeId) => {
                        const employee = employees.find(emp => emp.id === employeeId)
                        return (
                          <Badge
                            key={employeeId}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {employee?.empName}
                            <button
                              type="button"
                              onClick={() => toggleEmployee(employeeId)}
                              className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create Task
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
