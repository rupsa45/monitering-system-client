import { Link, useNavigate } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { AuthService } from '@/services/authService'

export function ProfileDropdown() {
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const user = auth.user

  const handleLogout = async () => {
    try {
      // Call logout API
      await AuthService.logout()
      
      // Clear authentication data
      auth.reset()
      
      // Show success message
      toast.success('Logged out successfully')
      
      // Redirect to login page
      navigate({ to: '/login' })
    } catch (error) {
      console.error('Logout error:', error)
      // Even if API call fails, clear local auth data
      auth.reset()
      navigate({ to: '/login' })
    }
  }

  // Generate initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user?.empProfile || '/avatars/01.png'} alt={user?.empName || 'User'} />
            <AvatarFallback>{getInitials(user?.empName || 'User')}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm leading-none font-medium'>{user?.empName || 'User'}</p>
            <p className='text-muted-foreground text-xs leading-none'>
              {user?.empEmail || 'user@example.com'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to='/settings/account'>
              Account
              <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

