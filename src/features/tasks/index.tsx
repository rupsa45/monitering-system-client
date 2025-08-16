import { useState, useEffect } from 'react'
import { Main } from '@/components/layout/main'
import { DataTable } from './components/data-table'
import { TasksDialogs } from './components/tasks-dialogs'
import TasksProvider from './context/tasks-context'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Loader2 } from 'lucide-react'
import { useAuth } from '@/stores/authStore'
import { TasksSidebar } from './components/tasks-sidebar'
import { TaskService, Task } from '@/services/taskService'
import { toast } from 'sonner'

export default function Tasks() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user, isAdmin, accessToken } = useAuth()

  // Fetch tasks when component mounts
  useEffect(() => {
    if (accessToken) {
      fetchTasks()
    }
  }, [accessToken])

  const fetchTasks = async () => {
    if (!accessToken) {
      console.log('Tasks - No access token available')
      return
    }
    
    console.log('Tasks - Starting to fetch tasks...')
    setLoading(true)
    try {
      const response = await TaskService.getTasks(accessToken)
      console.log('Tasks - API Response:', response)
      
      if (response.success && response.tasks) {
        console.log('Tasks - Setting tasks:', response.tasks)
        setTasks(response.tasks)
        console.log('Tasks - Successfully loaded tasks:', response.tasks.length, 'tasks')
      } else {
        console.log('Tasks - API returned success: false or no tasks')
        setTasks([])
      }
    } catch (error) {
      console.error('Tasks - Error fetching tasks:', error)
      toast.error('Failed to load tasks')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  // Refresh tasks after creating a new one
  const handleTaskCreated = () => {
    fetchTasks()
  }

  return (
    <TasksProvider>
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Tasks</h2>
            <p className='text-muted-foreground'>
              {loading 
                ? "Loading tasks..."
                : tasks.length === 0 
                  ? "No tasks yet. Tasks will appear here when created."
                  : `Here's a list of your ${tasks.length} tasks for this month!`
              }
            </p>
          </div>
          {isAdmin() && (
            <Button onClick={() => setIsSidebarOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Loading tasks...</h3>
              <p className="text-muted-foreground max-w-sm">
                Please wait while we fetch your tasks.
              </p>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No tasks yet</h3>
              <p className="text-muted-foreground max-w-sm">
                {isAdmin() 
                  ? "Get started by creating your first task. Click the 'Create Task' button to begin."
                  : "Tasks will appear here when they are created by administrators."
                }
              </p>
            </div>
            {isAdmin() && (
              <Button onClick={() => setIsSidebarOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Task
              </Button>
            )}
          </div>
        ) : (
          <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
            <DataTable data={tasks} onTaskUpdated={handleTaskCreated} />
          </div>
        )}
      </Main>

      {isAdmin() && (
        <TasksSidebar 
          open={isSidebarOpen} 
          onOpenChange={setIsSidebarOpen}
          onTaskCreated={handleTaskCreated}
        />
      )}
      <TasksDialogs />
    </TasksProvider>
  )
}
