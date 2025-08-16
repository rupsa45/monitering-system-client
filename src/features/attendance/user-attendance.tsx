import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/stores/authStore'
import { AttendanceService, TimesheetStatus } from '@/services/attendanceService'
import { toast } from 'sonner'
import { Clock, Coffee, Calendar, User, Loader2, TrendingUp, Activity, Square } from 'lucide-react'

export default function UserAttendance() {
  const { user, accessToken, isEmployee } = useAuth()
  const [currentStatus, setCurrentStatus] = useState<TimesheetStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (accessToken && user?.empId && isEmployee()) {
      fetchCurrentStatus()
    }
  }, [accessToken, user?.empId])

  const fetchCurrentStatus = async () => {
    const userId = user?.empId || user?.id
    console.log('UserAttendance - User object:', user)
    console.log('UserAttendance - User ID:', userId)
    console.log('UserAttendance - Access token:', accessToken ? 'Present' : 'Missing')
    
    if (!userId) {
      console.log('UserAttendance - No user ID available')
      return
    }

    try {
      setLoading(true)
      const response = await AttendanceService.getCurrentStatus(accessToken, userId.toString())
      if (response.success) {
        setCurrentStatus(response.data)
      }
    } catch (error) {
      console.error('Error fetching current status:', error)
      toast.error('Failed to fetch current status')
    } finally {
      setLoading(false)
    }
  }

  const handleClockIn = async () => {
    const userId = user?.empId || user?.id
    if (!userId) {
      toast.error('User ID not found')
      return
    }

    setActionLoading(true)
    try {
      const response = await AttendanceService.clockIn(accessToken, userId.toString())
      if (response.success) {
        toast.success(`Clocked in at ${AttendanceService.formatTime(response.clockInTime)}`)
        await fetchCurrentStatus()
      } else {
        toast.error(response.message || 'Failed to clock in')
      }
    } catch (error) {
      console.error('Error clocking in:', error)
      toast.error('Failed to clock in')
    } finally {
      setActionLoading(false)
    }
  }

  const handleClockOut = async () => {
    const userId = user?.empId || user?.id
    if (!userId) {
      toast.error('User ID not found')
      return
    }

    setActionLoading(true)
    try {
      const response = await AttendanceService.clockOut(accessToken, userId.toString())
      if (response.success) {
        toast.success(`Clocked out at ${AttendanceService.formatTime(response.clockOutTime)} (${response.workHours} hours worked)`)
        await fetchCurrentStatus()
      } else {
        toast.error(response.message || 'Failed to clock out')
      }
    } catch (error) {
      console.error('Error clocking out:', error)
      toast.error('Failed to clock out')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartBreak = async () => {
    const userId = user?.empId || user?.id
    if (!userId) {
      toast.error('User ID not found')
      return
    }

    setActionLoading(true)
    try {
      const response = await AttendanceService.startBreak(accessToken, userId.toString())
      if (response.success) {
        toast.success(`Break started at ${AttendanceService.formatTime(response.breakStartTime)}`)
        await fetchCurrentStatus()
      } else {
        toast.error(response.message || 'Failed to start break')
      }
    } catch (error) {
      console.error('Error starting break:', error)
      toast.error('Failed to start break')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEndBreak = async () => {
    const userId = user?.empId || user?.id
    if (!userId) {
      toast.error('User ID not found')
      return
    }

    setActionLoading(true)
    try {
      const response = await AttendanceService.endBreak(accessToken, userId.toString())
      if (response.success) {
        toast.success(`Break ended at ${AttendanceService.formatTime(response.breakEndTime)} (${response.breakDuration} minutes)`)
        await fetchCurrentStatus()
      } else {
        toast.error(response.message || 'Failed to end break')
      }
    } catch (error) {
      console.error('Error ending break:', error)
      toast.error('Failed to end break')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!currentStatus) return null

    if (currentStatus.isClockedOut) {
      return <Badge variant="secondary" className="px-4 py-2">Day Complete</Badge>
    } else if (currentStatus.isOnBreak) {
      return <Badge variant="outline" className="px-4 py-2 text-orange-600 border-orange-600">On Break</Badge>
    } else if (currentStatus.isClockedIn) {
      return <Badge variant="default" className="px-4 py-2">Clocked In</Badge>
    } else {
      return <Badge variant="outline" className="px-4 py-2">Not Clocked In</Badge>
    }
  }

  if (!isEmployee()) {
    console.log('UserAttendance - User is not an employee. User role:', user?.empRole)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">This page is only available for employees.</p>
          <p className="text-sm text-muted-foreground mt-2">Current role: {user?.empRole || 'Unknown'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Attendance</h1>
        <p className="text-muted-foreground">Track your daily attendance and work hours</p>
      </div>

      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Today's Status
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Current Status:</span>
                </div>
                {getStatusBadge()}
              </div>

              {/* Time Information */}
              {currentStatus && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Clock In:</span>
                      <span className="font-medium">
                        {AttendanceService.formatTime(currentStatus.clockInTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Clock Out:</span>
                      <span className="font-medium">
                        {AttendanceService.formatTime(currentStatus.clockOutTime)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Break Start:</span>
                      <span className="font-medium">
                        {AttendanceService.formatTime(currentStatus.breakStartTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Break Time:</span>
                      <span className="font-medium">
                        {currentStatus.totalBreakTime} minutes
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                {!currentStatus?.isClockedIn && !currentStatus?.isClockedOut && (
                  <Button 
                    onClick={handleClockIn} 
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {actionLoading ? 'Clocking In...' : 'Clock In'}
                  </Button>
                )}

                {currentStatus?.isClockedIn && !currentStatus?.isClockedOut && (
                  <>
                    <Button 
                      onClick={handleClockOut} 
                      disabled={actionLoading}
                      variant="destructive"
                    >
                      <Square className="mr-2 h-4 w-4" />
                      {actionLoading ? 'Clocking Out...' : 'Clock Out'}
                    </Button>

                    {!currentStatus?.isOnBreak && (
                      <Button 
                        onClick={handleStartBreak} 
                        disabled={actionLoading}
                        variant="outline"
                      >
                        <Coffee className="mr-2 h-4 w-4" />
                        {actionLoading ? 'Starting Break...' : 'Start Break'}
                      </Button>
                    )}

                    {currentStatus?.isOnBreak && (
                      <Button 
                        onClick={handleEndBreak} 
                        disabled={actionLoading}
                        variant="outline"
                      >
                        <Coffee className="mr-2 h-4 w-4" />
                        {actionLoading ? 'Ending Break...' : 'End Break'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Hours Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStatus?.clockIn && currentStatus?.clockOut 
                ? AttendanceService.calculateWorkHours(currentStatus.clockIn, currentStatus.clockOut)
                : '0'
              } hrs
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Break Time</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStatus?.totalBreakTime || 0} min
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStatus?.status || 'ABSENT'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common attendance actions you can perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={fetchCurrentStatus}
              disabled={loading}
            >
              <Activity className="mr-2 h-4 w-4" />
              Refresh Status
            </Button>
            <Button 
              variant="outline"
              onClick={() => toast.info('Attendance history feature coming soon!')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}