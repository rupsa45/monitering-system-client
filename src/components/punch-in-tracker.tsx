import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Clock, Coffee, Play, Square } from 'lucide-react'
import { BarChart3 } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/stores/authStore'
import { AttendanceService, TimesheetStatus } from '@/services/attendanceService'
import { toast } from 'sonner'

interface PunchInTrackerProps {
  className?: string
}

interface TimeSheetStatus {
  isClockedIn: boolean
  isClockedOut: boolean
  isOnBreak: boolean
  clockInTime: string | null
  clockOutTime: string | null
  breakStartTime: string | null
  totalBreakTime: number
  status: string
}

export function PunchInTracker({ className = '' }: PunchInTrackerProps) {
  const { accessToken, user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timeSheetStatus, setTimeSheetStatus] = useState<TimeSheetStatus>({
    isClockedIn: false,
    isClockedOut: false,
    isOnBreak: false,
    clockInTime: null,
    clockOutTime: null,
    breakStartTime: null,
    totalBreakTime: 0,
    status: 'ABSENT'
  })
  const [loading, setLoading] = useState(false)
  
  // Confirmation dialog states
  const [showPunchInDialog, setShowPunchInDialog] = useState(false)
  const [showPunchOutDialog, setShowPunchOutDialog] = useState(false)
  const [showBreakDialog, setShowBreakDialog] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Fetch current timesheet status on component mount
  useEffect(() => {
    if (accessToken) {
      fetchCurrentStatus()
    }
  }, [accessToken])

  const fetchCurrentStatus = async () => {
    try {
      // Use empId if available, otherwise fall back to id
      const userId = user?.empId || user?.id
      
      if (!userId) {
        console.log('PunchInTracker - No user ID available for status fetch')
        return
      }
      
      const response = await AttendanceService.getCurrentStatus(accessToken, userId.toString())
      if (response.success) {
        setTimeSheetStatus(response.data)
      }
    } catch (error) {
      console.error('Error fetching timesheet status:', error)
    }
  }

  const handlePunchIn = async () => {
    setLoading(true)
    try {
      // Use empId if available, otherwise fall back to id
      const userId = user?.empId || user?.id
      
      if (!userId) {
        toast.error('User ID not found. Please log in again.')
        return
      }
      
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
      setLoading(false)
      setShowPunchInDialog(false)
    }
  }

  const handlePunchOut = async () => {
    setLoading(true)
    try {
      // Use empId if available, otherwise fall back to id
      const userId = user?.empId || user?.id
      
      if (!userId) {
        toast.error('User ID not found. Please log in again.')
        return
      }
      
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
      setLoading(false)
      setShowPunchOutDialog(false)
    }
  }

  const handleTakeBreak = async () => {
    setLoading(true)
    try {
      // Use empId if available, otherwise fall back to id
      const userId = user?.empId || user?.id
      
      if (!userId) {
        toast.error('User ID not found. Please log in again.')
        return
      }
      
      let response
      if (timeSheetStatus.isOnBreak) {
        response = await AttendanceService.endBreak(accessToken, userId.toString())
        if (response.success) {
          toast.success(`Break ended at ${AttendanceService.formatTime(response.breakEndTime)} (${response.breakDuration} minutes)`)
        }
      } else {
        response = await AttendanceService.startBreak(accessToken, userId.toString())
        if (response.success) {
          toast.success(`Break started at ${AttendanceService.formatTime(response.breakStartTime)}`)
        }
      }
      
      if (response.success) {
        await fetchCurrentStatus()
      } else {
        toast.error(response.message || `Failed to ${timeSheetStatus.isOnBreak ? 'end' : 'start'} break`)
      }
    } catch (error) {
      console.error('Error handling break:', error)
      toast.error(`Failed to ${timeSheetStatus.isOnBreak ? 'end' : 'start'} break`)
    } finally {
      setLoading(false)
      setShowBreakDialog(false)
      setShowResumeDialog(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m}m`
  }

  return (
    <>
      <div className={`flex items-center justify-between w-full ${className}`}>
        {/* Left side - Time tracking info */}
        <div className='flex items-center space-x-4 text-sm overflow-hidden'>
          <SidebarTrigger 
            variant='outline' 
            className='w-8 h-8 p-0 flex-shrink-0 mr-2'
            style={{ minWidth: 32, minHeight: 32 }}
          />
          <div className='flex items-center space-x-2 flex-shrink-0'>
            <Clock className='h-4 w-4 text-muted-foreground' />
            <span className='whitespace-nowrap font-bold'>{formatTime(currentTime)}</span>
          </div>
          
          {timeSheetStatus.clockInTime && (
            <div className='flex items-center space-x-2 flex-shrink-0'>
              <Clock className='h-4 w-4 text-muted-foreground' />
              <span className='whitespace-nowrap'>
                Started at <span className='font-bold'>{AttendanceService.formatTime(timeSheetStatus.clockInTime)}</span>
              </span>
            </div>
          )}
          
          {timeSheetStatus.clockInTime && timeSheetStatus.clockOutTime && (
            <div className='flex items-center space-x-2 flex-shrink-0'>
              <BarChart3 className='h-4 w-4 text-muted-foreground' />
              <span className='whitespace-nowrap'>{AttendanceService.calculateWorkHours(timeSheetStatus.clockInTime, timeSheetStatus.clockOutTime)}h Today</span>
            </div>
          )}
          
          {timeSheetStatus.isOnBreak && (
            <div className='flex items-center space-x-2 flex-shrink-0'>
              <Clock className='h-4 w-4 text-muted-foreground' />
              <span className='whitespace-nowrap'>{timeSheetStatus.totalBreakTime}m Break</span>
            </div>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className='flex items-center space-x-2 flex-shrink-0 ml-4'>
          {timeSheetStatus.isClockedIn && !timeSheetStatus.isClockedOut && (
            <Button
              onClick={() => timeSheetStatus.isOnBreak ? setShowResumeDialog(true) : setShowBreakDialog(true)}
              variant='outline'
              size='sm'
              className={`${
                timeSheetStatus.isOnBreak 
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              <Coffee className='h-4 w-4 mr-1' />
              <span className='hidden sm:inline'>{timeSheetStatus.isOnBreak ? 'Resume' : 'Take Break'}</span>
            </Button>
          )}
          
          {timeSheetStatus.isClockedIn && !timeSheetStatus.isClockedOut && !timeSheetStatus.isOnBreak && (
            <Button
              onClick={() => setShowPunchOutDialog(true)}
              variant='outline'
              size='sm'
              disabled={loading}
              className='bg-red-500 text-white hover:bg-red-600 border-red-500'
            >
              <Square className='h-4 w-4 mr-1' />
              <span className='hidden sm:inline'>Clock Out</span>
            </Button>
          )}
          
          {!timeSheetStatus.isClockedIn && !timeSheetStatus.isClockedOut && (
            <Button
              onClick={() => setShowPunchInDialog(true)}
              variant='outline'
              size='sm'
              disabled={loading}
              className='bg-green-500 text-white hover:bg-green-600 border-green-500'
            >
              <Play className='h-4 w-4 mr-1' />
              <span className='hidden sm:inline'>Clock In</span>
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog open={showPunchInDialog} onOpenChange={setShowPunchInDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clock In</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clock in? This will start tracking your work time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePunchIn} disabled={loading}>
              {loading ? 'Clocking In...' : 'Clock In'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPunchOutDialog} onOpenChange={setShowPunchOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clock Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clock out? This will end your work session for today.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePunchOut} disabled={loading}>
              {loading ? 'Clocking Out...' : 'Clock Out'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBreakDialog} onOpenChange={setShowBreakDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Take Break</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to start your break? This will pause your work time tracking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTakeBreak} disabled={loading}>
              {loading ? 'Starting Break...' : 'Start Break'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Work</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to resume work? This will end your break and continue tracking work time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTakeBreak} disabled={loading}>
              {loading ? 'Resuming...' : 'Resume Work'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}