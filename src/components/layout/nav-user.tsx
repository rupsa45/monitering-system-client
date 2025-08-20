import { Link } from '@tanstack/react-router'
import {
  ChevronsUpDown,
  LogOut,
  User,
  Settings,
  Clock,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/stores/authStore'
import { TimesheetService } from '@/services/timesheetService'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { user: authUser, reset, accessToken } = useAuth()
  const [clockLoading, setClockLoading] = useState(false)
  const [timesheetStatus, setTimesheetStatus] = useState<any>(null)

  // Fetch timesheet status for employees
  useEffect(() => {
    if (authUser?.empRole === 'employee' && accessToken && authUser?.id) {
      fetchTimesheetStatus()
      
      // Auto-refresh status every 30 seconds for extended sessions
      const interval = setInterval(() => {
        fetchTimesheetStatus()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [authUser, accessToken])

  const fetchTimesheetStatus = async () => {
    if (!accessToken || !authUser?.id) return

    try {
      const status = await TimesheetService.getCurrentStatus(accessToken, authUser.id.toString())
      setTimesheetStatus(status)
    } catch (error) {
      console.error('Error fetching timesheet status:', error)
    }
  }

  const handleClockOut = async () => {
    if (!accessToken || !authUser?.id) {
      toast.error('Authentication required')
      return
    }

    setClockLoading(true)
    try {
      const response = await TimesheetService.clockOut(accessToken, authUser.id.toString())
      if (response.success) {
        toast.success(`Clocked out successfully at ${response.clockOutTime}`)
        await fetchTimesheetStatus()
      } else {
        toast.error(response.message || 'Failed to clock out')
      }
    } catch (error) {
      console.error('Error with clock out:', error)
      toast.error('Failed to clock out. Please try again.')
    } finally {
      setClockLoading(false)
    }
  }

  const handleLogout = () => {
    reset()
    toast.success('Logged out successfully')
    // Redirect to login page
    window.location.href = '/login'
  }

  // Use auth user data if available, otherwise fall back to default user data
  const displayUser = authUser || user
  const userName = authUser?.empName || user.name
  const userEmail = authUser?.empEmail || user.email
  const userAvatar = authUser?.empProfile || user.avatar
  const userRole = authUser?.empRole || 'User'



  // Generate initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <Avatar className='h-8 w-8 rounded-lg'>
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className='rounded-lg'>
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>{userName}</span>
                <span className='truncate text-xs'>{userEmail}</span>
                {authUser?.empRole === 'employee' && timesheetStatus && (
                  <div className='space-y-1'>
                    <span className={`truncate text-xs ${
                      timesheetStatus.isClockedIn && !timesheetStatus.isClockedOut 
                        ? 'text-green-500' 
                        : 'text-muted-foreground'
                    }`}>
                      {timesheetStatus.isClockedIn && !timesheetStatus.isClockedOut 
                        ? '🟢 Clocked In' 
                        : timesheetStatus.isClockedOut 
                          ? '🔴 Clocked Out' 
                          : '⚪ Not Clocked In'
                      }
                    </span>
                    {timesheetStatus.isClockedIn && timesheetStatus.clockInTime && (
                      <span className='truncate text-xs text-muted-foreground'>
                        Since: {new Date(timesheetStatus.clockInTime).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <ChevronsUpDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className='rounded-lg'>
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>{userName}</span>
                  <span className='truncate text-xs'>{userEmail}</span>
                  <span className='truncate text-xs text-muted-foreground capitalize'>
                    {userRole}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to='/settings'>
                  <User className='mr-2 h-4 w-4' />
                  Profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            {/* Clock Out Button for Employees */}
            {authUser?.empRole === 'employee' && timesheetStatus?.isClockedIn && !timesheetStatus?.isClockedOut && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleClockOut}
                  disabled={clockLoading}
                  className={clockLoading ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Clock className='mr-2 h-4 w-4' />
                  {clockLoading ? 'Clocking Out...' : 'Clock Out'}
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className='mr-2 h-4 w-4' />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
