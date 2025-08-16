import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Main } from '@/components/layout/main'
import { useAuth } from '@/stores/authStore'
import { AuthService } from '@/services/authService'
import { TimesheetService, TimesheetStatus } from '@/services/timesheetService'
import { toast } from 'sonner'
import { 
  Clock, 
  Calendar, 
  CheckSquare, 
  Percent,
  User,
  Activity,
  TrendingUp,
  Award,
  IconClock as TablerClock,
  IconClockOff
} from 'lucide-react'

interface EmployeeStats {
  totalTimeSheets: number
  totalLeaves: number
  totalTasks: number
  completedTasks: number
  completionRate: number
}

interface EmployeeProfile {
  empId: number
  empName: string
  empEmail: string
  empTechnology: string
  empRole: string
  isActive: boolean
  statistics: EmployeeStats
}

export default function EmployeeDashboard() {
  const { accessToken, user } = useAuth()
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [timesheetStatus, setTimesheetStatus] = useState<TimesheetStatus | null>(null)
  const [clockLoading, setClockLoading] = useState(false)

  useEffect(() => {
    fetchEmployeeProfile()
    fetchTimesheetStatus()
  }, [accessToken])

  const fetchEmployeeProfile = async () => {
    try {
      const response = await AuthService.getUserProfile(accessToken)
      if (response.success) {
        setProfile(response.data)
      } else {
        toast.error(response.message || 'Failed to load profile')
      }
    } catch (error) {
      toast.error('Failed to load employee data')
      console.error('Error fetching employee profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTimesheetStatus = async () => {
    if (!accessToken || !user?.empId) return

    try {
      // Use empId if available, otherwise fall back to id
      const userId = user?.empId || user?.id
      
      if (!userId) {
        console.log('EmployeeDashboard - No user ID available for status fetch')
        return
      }
      
      const status = await TimesheetService.getCurrentStatus(accessToken, userId.toString())
      setTimesheetStatus(status)
    } catch (error) {
      console.error('Error fetching timesheet status:', error)
      // Don't show error toast for status fetch as it might not be critical
    }
  }

  const handleClockInOut = async () => {
    if (!accessToken || !user?.empId) {
      toast.error('Authentication required')
      return
    }

    setClockLoading(true)
    try {
      // Use empId if available, otherwise fall back to id
      const userId = user?.empId || user?.id
      
      if (!userId) {
        toast.error('User ID not found. Please log in again.')
        return
      }
      
      if (!timesheetStatus?.isClockedIn) {
        // Clock In
        const response = await TimesheetService.clockIn(accessToken, userId.toString())
        if (response.success) {
          toast.success(`Clocked in successfully at ${response.clockInTime}`)
          await fetchTimesheetStatus()
        } else {
          toast.error(response.message || 'Failed to clock in')
        }
      } else if (!timesheetStatus?.isClockedOut) {
        // Clock Out
        const response = await TimesheetService.clockOut(accessToken, userId.toString())
        if (response.success) {
          toast.success(`Clocked out successfully at ${response.clockOutTime}`)
          await fetchTimesheetStatus()
        } else {
          toast.error(response.message || 'Failed to clock out')
        }
      }
    } catch (error) {
      console.error('Error with clock in/out:', error)
      toast.error('Failed to process clock in/out. Please try again.')
    } finally {
      setClockLoading(false)
    }
  }

  const getClockButtonText = () => {
    if (clockLoading) return 'Processing...'
    if (!timesheetStatus?.isClockedIn) return 'Clock In'
    if (!timesheetStatus?.isClockedOut) return 'Clock Out'
    return 'Day Complete'
  }

  const getClockButtonVariant = () => {
    if (clockLoading) return 'outline'
    if (!timesheetStatus?.isClockedIn) return 'default'
    if (!timesheetStatus?.isClockedOut) return 'destructive'
    return 'secondary'
  }

  const getClockButtonIcon = () => {
    if (clockLoading) return <Clock className="h-6 w-6 mb-2 animate-spin" />
    if (!timesheetStatus?.isClockedIn) return <TablerClock className="h-6 w-6 mb-2" />
    if (!timesheetStatus?.isClockedOut) return <IconClockOff className="h-6 w-6 mb-2" />
    return <Clock className="h-6 w-6 mb-2" />
  }

  const isClockButtonDisabled = () => {
    return clockLoading || timesheetStatus?.isClockedOut
  }

  if (loading) {
    return (
      <Main>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading employee dashboard...</div>
        </div>
      </Main>
    )
  }

  if (!profile) {
    return (
      <Main>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Failed to load employee data</div>
        </div>
      </Main>
    )
  }

  return (
    <Main>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile.empName}! Here's your activity overview.
            </p>
            {/* Clock Status */}
            {timesheetStatus && (
              <div className="mt-2">
                <Badge 
                  variant={
                    timesheetStatus.isClockedOut 
                      ? "secondary" 
                      : timesheetStatus.isClockedIn 
                        ? "default" 
                        : "outline"
                  }
                  className="mr-2"
                >
                  {timesheetStatus.isClockedOut 
                    ? "Day Complete" 
                    : timesheetStatus.isClockedIn 
                      ? `Clocked In at ${timesheetStatus.clockInTime}` 
                      : "Not Clocked In"
                  }
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={profile.isActive ? "default" : "destructive"}>
              {profile.isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant="outline">
              {profile.empTechnology}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Sheets</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.statistics.totalTimeSheets || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total time sheets submitted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.statistics.totalLeaves || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total leave requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.statistics.totalTasks || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total tasks assigned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.statistics.completionRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Task completion rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common actions you can perform from your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant={getClockButtonVariant()} 
                onClick={handleClockInOut} 
                disabled={isClockButtonDisabled()}
                className="h-20 flex flex-col items-center justify-center"
              >
                {getClockButtonIcon()}
                <span>{getClockButtonText()}</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Calendar className="h-6 w-6 mb-2" />
                <span>Request Leave</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <CheckSquare className="h-6 w-6 mb-2" />
                <span>View Tasks</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent activities and updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Task Completed</p>
                  <p className="text-xs text-muted-foreground">You completed a task assignment</p>
                </div>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Time Sheet Submitted</p>
                  <p className="text-xs text-muted-foreground">Weekly time sheet was submitted</p>
                </div>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Leave Request</p>
                  <p className="text-xs text-muted-foreground">Leave request was approved</p>
                </div>
                <span className="text-xs text-muted-foreground">3 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>
              Your performance metrics and achievements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Productivity</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${profile.statistics.completionRate || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {profile.statistics.completionRate || 0}% task completion rate
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Attendance</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min((profile.statistics.totalTimeSheets || 0) * 10, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {profile.statistics.totalTimeSheets || 0} time sheets submitted
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Main>
  )
}

