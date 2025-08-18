import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/stores/authStore'
import { TaskService } from '@/services/taskService'
import { toast } from 'sonner'
import { Clock, CheckCircle, AlertCircle, Calendar, User, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface EmployeeTask {
  id: string
  title: string
  description: string
  status: string
  dueDate: string
  createdAt: string
  updatedAt: string
}

interface TaskStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
  dueToday: number
}

export default function EmployeeTasks() {
  const { accessToken, user, isEmployee } = useAuth()
  const [tasks, setTasks] = useState<EmployeeTask[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)

  useEffect(() => {
    if (accessToken && isEmployee()) {
      fetchTasks()
      fetchStats()
    }
  }, [accessToken, statusFilter])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      console.log('EmployeeTasks - Fetching tasks with status filter:', statusFilter)
      // Don't send status parameter if "all" is selected
      const filterStatus = statusFilter === 'all' ? undefined : statusFilter
      const response = await TaskService.getMyTasks(accessToken, filterStatus)
      console.log('EmployeeTasks - Tasks API response:', response)
      if (response.success) {
        setTasks(response.tasks || [])
        console.log('EmployeeTasks - Set tasks:', response.tasks)
      } else {
        toast.error('Failed to fetch tasks')
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      console.log('EmployeeTasks - Fetching task stats...')
      const response = await TaskService.getMyTaskStats(accessToken)
      console.log('EmployeeTasks - Stats API response:', response)
      if (response.success) {
        setStats(response.statistics)
        console.log('EmployeeTasks - Set stats:', response.statistics)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      setUpdatingTask(taskId)
      const response = await TaskService.updateMyTaskStatus(accessToken, taskId, newStatus)
      if (response.success) {
        toast.success('Task status updated successfully!')
        fetchTasks() // Refresh tasks
        fetchStats() // Refresh stats
      } else {
        toast.error(response.message || 'Failed to update task status')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    } finally {
      setUpdatingTask(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-yellow-100 text-yellow-800'
      case 'doing': return 'bg-blue-100 text-blue-800'
      case 'done': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <AlertCircle className="h-4 w-4" />
      case 'doing': return <Clock className="h-4 w-4" />
      case 'done': return <CheckCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const isOverdue = (dueDate: string, taskStatus: string) => {
    return new Date(dueDate) < new Date() && taskStatus !== 'done'
  }

  if (!isEmployee()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">This page is only available for employees.</p>
          <p className="text-sm text-muted-foreground mt-2">Current role: {user?.empRole || 'unknown'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground">Manage and update your assigned tasks</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center space-x-4">
                 <Select value={statusFilter} onValueChange={setStatusFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
                     <SelectContent>
             <SelectItem value="all">All Tasks</SelectItem>
             <SelectItem value="todo">Pending</SelectItem>
             <SelectItem value="doing">In Progress</SelectItem>
             <SelectItem value="done">Completed</SelectItem>
           </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                             <p className="text-muted-foreground">
                 {statusFilter === 'all' ? 'No tasks assigned to you yet.' : `No ${statusFilter} tasks assigned to you.`}
               </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
                         <Card key={task.id} className={isOverdue(task.dueDate, task.status) ? 'border-red-200 bg-red-50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {task.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge className={getStatusColor(task.status)}>
                      {getStatusIcon(task.status)}
                      <span className="ml-1 capitalize">{task.status}</span>
                    </Badge>
                                         {isOverdue(task.dueDate, task.status) && (
                       <Badge variant="destructive">Overdue</Badge>
                     )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Assigned to you
                    </div>
                  </div>
                  
                  {/* Status Update */}
                  <div className="flex items-center space-x-2">
                    <Select 
                      value={task.status} 
                      onValueChange={(value) => handleStatusUpdate(task.id, value)}
                      disabled={updatingTask === task.id}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">Pending</SelectItem>
                        <SelectItem value="doing">In Progress</SelectItem>
                        <SelectItem value="done">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    {updatingTask === task.id && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
