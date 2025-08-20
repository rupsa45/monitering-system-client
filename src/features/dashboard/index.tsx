import { useState, useEffect } from 'react'
import { Button as _Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Main } from '@/components/layout/main'
import { Overview } from './components/overview'
import { RecentSales } from './components/recent-sales'
import { useAuth } from '@/stores/authStore'
import { DashboardService, DashboardOverview, RecentActivity, PerformanceData } from '@/services/dashboardService'
import { toast } from 'sonner'
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Clock, 
  Activity,
  Loader2,
  RefreshCw,
  TrendingUp,
  Target,
  BarChart3
} from 'lucide-react'

export default function Dashboard() {
  const { accessToken } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [performanceLoading, setPerformanceLoading] = useState(false)

  useEffect(() => {
    if (accessToken) {
      fetchDashboardData()
    }
  }, [accessToken])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await DashboardService.getDashboardOverview(accessToken)
      if (response.success) {
        setDashboardData(response.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchPerformanceData = async () => {
    try {
      setPerformanceLoading(true)
      const response = await DashboardService.getDashboardPerformance(accessToken)
      if (response.success) {
        setPerformanceData(response.data)
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
      toast.error('Failed to fetch performance data')
    } finally {
      setPerformanceLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardData()
  }

  if (loading) {
    return (
      <Main>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Main>
    )
  }

  return (
    <>
      {/* ===== Main ===== */}
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <_Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </_Button>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='performance'>Performance</TabsTrigger>
              <TabsTrigger value='analytics' disabled>
                Analytics
              </TabsTrigger>
              <TabsTrigger value='reports' disabled>
                Reports
              </TabsTrigger>
              <TabsTrigger value='notifications' disabled>
                Notifications
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Employees
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {dashboardData?.summary.totalEmployees || 0}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Active employees in system
                  </p>
                </CardContent>
              </Card>
                             <Card>
                 <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                   <CardTitle className='text-sm font-medium'>
                     Today's Attendance
                   </CardTitle>
                   <UserCheck className="h-4 w-4 text-green-600" />
                 </CardHeader>
                 <CardContent>
                   <div className='text-2xl font-bold text-green-600'>
                     {dashboardData?.summary.todayAttendance || 0}
                   </div>
                   <p className='text-xs text-muted-foreground'>
                     Employees clocked in today
                   </p>
                 </CardContent>
               </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Week Attendance</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-blue-600'>
                    {dashboardData?.summary.weekAttendance || 0}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    This week's attendance
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Pending Leaves
                  </CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-orange-600'>
                    {dashboardData?.summary.pendingLeaves || 0}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Leave requests pending
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Active Tasks
                  </CardTitle>
                  <Activity className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-purple-600'>
                    {dashboardData?.summary.activeTasks || 0}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Tasks in progress
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
              <Card className='col-span-4'>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className='pl-2'>
                  <Overview />
                </CardContent>
              </Card>
              <Card className='col-span-3'>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>
                    Latest employee attendance activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentActivities activities={dashboardData?.recentActivities || []} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value='performance' className='space-y-4'>
            <PerformanceTab 
              data={performanceData} 
              loading={performanceLoading} 
              onRefresh={fetchPerformanceData}
            />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

// Performance Tab Component
function PerformanceTab({ 
  data, 
  loading, 
  onRefresh 
}: { 
  data: PerformanceData | null
  loading: boolean
  onRefresh: () => void
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No performance data</h3>
        <p className="text-muted-foreground mb-4">
          Performance data is not available.
        </p>
        <_Button onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </_Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Analytics</h1>
          <p className="text-muted-foreground">Employee performance metrics and insights</p>
        </div>
        <_Button onClick={onRefresh} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </_Button>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.attendance.attendanceRate}%
            </div>
                         <p className="text-xs text-muted-foreground">
               {data.attendance.presentDays} clocked in / {data.attendance.totalDays} total days
             </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.tasks.completionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.tasks.completed} completed / {data.tasks.totalAssigned} assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Work Hours</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data.productivity.averageWorkHours}h
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {data.productivity.totalWorkHours}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.employeePerformance.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Performance tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Employee Performance Details
          </CardTitle>
          <CardDescription>
            Individual performance metrics for each employee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Employee</th>
                  <th className="text-left p-4 font-medium">Technology</th>
                  <th className="text-left p-4 font-medium">Attendance</th>
                  <th className="text-left p-4 font-medium">Tasks</th>
                  <th className="text-left p-4 font-medium">Work Hours</th>
                </tr>
              </thead>
              <tbody>
                {data.employeePerformance.map((employee, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{employee.empName}</div>
                        <div className="text-sm text-muted-foreground">{employee.empEmail}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {employee.empTechnology}
                      </span>
                    </td>
                    <td className="p-4">
                                             <div className="space-y-1">
                         <div className="text-sm">
                           <span className="text-green-600 font-medium">{employee.attendance.present}</span> clocked in
                         </div>
                         <div className="text-sm text-muted-foreground">
                           {employee.attendance.absent} absent, {employee.attendance.late} late
                         </div>
                       </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-blue-600 font-medium">{employee.tasks.completed}</span> completed
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {employee.tasks.pending} pending, {employee.tasks.inProgress} in progress
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium">
                      {employee.workHours}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Recent Activities Component
function RecentActivities({ activities }: { activities: RecentActivity[] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No recent activities</h3>
        <p className="text-muted-foreground">
          No employee activities found for today.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium  truncate">
              {activity.employee.empName}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {activity.employee.empTechnology}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">
                {DashboardService.formatTime(activity.clockIn)} - {DashboardService.formatTime(activity.clockOut)}
              </span>
              <span className="text-xs font-medium text-blue-600">
                {DashboardService.calculateWorkingHours(activity)}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activity.status === 'PRESENT' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {activity.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
