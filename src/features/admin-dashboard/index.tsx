import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Main } from '@/components/layout/main'
import { useAuth } from '@/stores/authStore'
import { API_CONFIG, API_ENDPOINTS } from '@/config/api'
import { AuthService } from '@/services/authService'
import { toast } from 'sonner'
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Activity
} from 'lucide-react'

interface DashboardStats {
  totalEmployees: number
  todayAttendance: number
  weekAttendance: number
  pendingLeaves: number
  activeTasks: number
}

interface RecentActivity {
  id: string
  clockIn: string
  clockOut: string
  status: string
  employee: {
    empName: string
    empEmail: string
    empTechnology: string
  }
}

interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  halfDays: number
  attendanceRate: string
}

interface EmployeeAttendance {
  empName: string
  empEmail: string
  empTechnology: string
  present: number
  absent: number
  late: number
  halfDay: number
  total: number
}

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string
  assignedEmployees: {
    id: string
    empName: string
    empEmail: string
    empTechnology: string
  }[]
}

interface TaskStatistics {
  statusDistribution: {
    status: string
    _count: {
      status: number
    }
  }[]
  priorityDistribution: {
    priority: string
    _count: {
      priority: number
    }
  }[]
}

export default function AdminDashboard() {
  const { accessToken, user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    todayAttendance: 0,
    weekAttendance: 0,
    pendingLeaves: 0,
    activeTasks: 0,
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null)
  const [employeeAttendance, setEmployeeAttendance] = useState<EmployeeAttendance[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskStats, setTaskStats] = useState<TaskStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const headers = AuthService.getAuthHeaders(accessToken)
      
      // Fetch dashboard overview
      const overviewResponse = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.admin.dashboardOverview}`, {
        headers,
      })
      
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json()
        if (overviewData.success) {
          setStats(overviewData.data.summary)
          setRecentActivities(overviewData.data.recentActivities || [])
        }
      }

      // Fetch attendance analytics
      const currentDate = new Date()
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0]
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0]
      
      const attendanceResponse = await fetch(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.admin.dashboardAttendance}?startDate=${startDate}&endDate=${endDate}`, 
        { headers }
      )
      
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json()
        if (attendanceData.success) {
          setAttendanceSummary(attendanceData.data.summary)
          setEmployeeAttendance(attendanceData.data.employeeAttendance || [])
        }
      }

      // Fetch task management data
      const tasksResponse = await fetch(
        `${API_CONFIG.baseURL}${API_ENDPOINTS.admin.dashboardTasks}?status=PENDING&priority=HIGH`, 
        { headers }
      )
      
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        if (tasksData.success) {
          setTasks(tasksData.data.tasks || [])
          setTaskStats(tasksData.data.statistics || null)
        }
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }



  if (loading) {
    return (
      <Main>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </Main>
    )
  }

  return (
    <Main>
      <div className='mb-6 flex items-center justify-between space-y-2'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Admin Dashboard</h1>
          <p className='text-muted-foreground'>
            Welcome back, {user?.empName}! Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/admin-employee-management'}>
            <Users className="mr-2 h-4 w-4" />
            Manage Employees
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Employees</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalEmployees}</div>
            <p className='text-xs text-muted-foreground'>
              All registered employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Today's Attendance</CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.todayAttendance}</div>
            <p className='text-xs text-muted-foreground'>
              {stats.weekAttendance} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Pending Leaves</CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.pendingLeaves}</div>
            <p className='text-xs text-muted-foreground'>
              Require your approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Tasks</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.activeTasks}</div>
            <p className='text-xs text-muted-foreground'>
              Currently in progress
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='employees'>Employees</TabsTrigger>
          <TabsTrigger value='leaves'>Leave Requests</TabsTrigger>
          <TabsTrigger value='attendance'>Attendance</TabsTrigger>
          <TabsTrigger value='tasks'>Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>
                  Latest employee activities and attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className='flex items-center justify-between p-3 border rounded-lg'>
                      <div>
                        <p className='font-medium'>{activity.employee.empName}</p>
                        <p className='text-sm text-muted-foreground'>{activity.employee.empEmail}</p>
                        <p className='text-xs text-muted-foreground'>
                          {activity.clockIn} - {activity.clockOut} ({activity.status})
                        </p>
                      </div>
                      <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'>
                        {activity.employee.empTechnology}
                      </span>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <p className='text-center text-muted-foreground py-4'>
                      No recent activities
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>High Priority Tasks</CardTitle>
                <CardDescription>
                  Tasks requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className='p-3 border rounded-lg'>
                      <div className='flex items-center justify-between mb-2'>
                        <p className='font-medium'>{task.title}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                          task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className='text-sm text-muted-foreground mb-1'>{task.description}</p>
                      <p className='text-xs text-muted-foreground'>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                      <div className='mt-2'>
                        <p className='text-xs text-muted-foreground'>Assigned to:</p>
                        {task.assignedEmployees.map((emp) => (
                          <span key={emp.id} className='text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded mr-1'>
                            {emp.empName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className='text-center text-muted-foreground py-4'>
                      No high priority tasks
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='employees' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Employee Management</CardTitle>
              <CardDescription>
                Manage all employees in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Employee management features will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='leaves' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Leave Management</CardTitle>
              <CardDescription>
                Approve or reject employee leave requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Leave management features will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='attendance' className='space-y-4'>
          {attendanceSummary && (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Attendance Rate</CardTitle>
                  <CheckCircle className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{attendanceSummary.attendanceRate}%</div>
                  <p className='text-xs text-muted-foreground'>
                    Overall attendance rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Present Days</CardTitle>
                  <Users className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{attendanceSummary.presentDays}</div>
                  <p className='text-xs text-muted-foreground'>
                    Out of {attendanceSummary.totalDays} total days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Late Days</CardTitle>
                  <Clock className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{attendanceSummary.lateDays}</div>
                  <p className='text-xs text-muted-foreground'>
                    {attendanceSummary.halfDays} half days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Absent Days</CardTitle>
                  <AlertCircle className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{attendanceSummary.absentDays}</div>
                  <p className='text-xs text-muted-foreground'>
                    Total absent days
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Employee Attendance Details</CardTitle>
              <CardDescription>
                Individual employee attendance breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {employeeAttendance.map((emp, index) => (
                  <div key={index} className='flex items-center justify-between p-3 border rounded-lg'>
                    <div>
                      <p className='font-medium'>{emp.empName}</p>
                      <p className='text-sm text-muted-foreground'>{emp.empEmail}</p>
                      <p className='text-xs text-muted-foreground'>{emp.empTechnology}</p>
                    </div>
                    <div className='text-right'>
                      <div className='flex gap-2 text-xs'>
                        <span className='bg-green-100 text-green-800 px-2 py-1 rounded'>
                          Present: {emp.present}
                        </span>
                        <span className='bg-red-100 text-red-800 px-2 py-1 rounded'>
                          Absent: {emp.absent}
                        </span>
                        <span className='bg-yellow-100 text-yellow-800 px-2 py-1 rounded'>
                          Late: {emp.late}
                        </span>
                        <span className='bg-orange-100 text-orange-800 px-2 py-1 rounded'>
                          Half: {emp.halfDay}
                        </span>
                      </div>
                      <p className='text-xs text-muted-foreground mt-1'>
                        Total: {emp.total} days
                      </p>
                    </div>
                  </div>
                ))}
                {employeeAttendance.length === 0 && (
                  <p className='text-center text-muted-foreground py-4'>
                    No attendance data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='tasks' className='space-y-4'>
          {taskStats && (
            <div className='grid gap-4 md:grid-cols-2 mb-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Task Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    {taskStats.statusDistribution.map((status) => (
                      <div key={status.status} className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>{status.status}</span>
                        <span className='text-sm text-muted-foreground'>
                          {status._count.status} tasks
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Task Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    {taskStats.priorityDistribution.map((priority) => (
                      <div key={priority.priority} className='flex items-center justify-between'>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          priority.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                          priority.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {priority.priority}
                        </span>
                        <span className='text-sm text-muted-foreground'>
                          {priority._count.priority} tasks
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
              <CardDescription>
                Complete list of tasks with details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {tasks.map((task) => (
                  <div key={task.id} className='p-4 border rounded-lg'>
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex-1'>
                        <h3 className='font-semibold text-lg'>{task.title}</h3>
                        <p className='text-sm text-muted-foreground mt-1'>{task.description}</p>
                      </div>
                      <div className='flex gap-2 ml-4'>
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                          task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    
                    <div className='flex items-center justify-between text-sm text-muted-foreground mb-3'>
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      <span>{task.assignedEmployees.length} assigned</span>
                    </div>
                    
                    <div>
                      <p className='text-sm font-medium mb-2'>Assigned Employees:</p>
                      <div className='flex flex-wrap gap-2'>
                        {task.assignedEmployees.map((emp) => (
                          <div key={emp.id} className='flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full'>
                            <span className='text-xs font-medium'>{emp.empName}</span>
                            <span className='text-xs text-muted-foreground'>({emp.empTechnology})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className='text-center text-muted-foreground py-8'>
                    No tasks available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Main>
  )
}
