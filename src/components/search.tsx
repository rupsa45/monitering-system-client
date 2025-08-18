import { IconSearch } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useSearch } from '@/context/search-context'
import { Button } from './ui/button'
import { useAuth } from '@/stores/authStore'

interface Props {
  className?: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
}

export function Search({ className = '', placeholder = 'Search' }: Props) {
  const { user } = useAuth()
  
  // Only render search if user is authenticated
  if (!user) {
    return null
  }
  
  try {
    const { setOpen } = useSearch()
    return (
      <Button
        variant='outline'
        size='icon'
        className={cn(
          'bg-muted/25 text-muted-foreground hover:bg-muted/50 relative h-8 w-8 rounded-md shadow-none',
          className
        )}
        onClick={() => setOpen(true)}
      >
        <IconSearch
          aria-hidden='true'
          className='h-4 w-4'
        />
      </Button>
    )
  } catch (error) {
    // Fallback if search context is not available
    return (
      <Button
        variant='outline'
        size='icon'
        className={cn(
          'bg-muted/25 text-muted-foreground hover:bg-muted/50 relative h-8 w-8 rounded-md shadow-none',
          className
        )}
        disabled
      >
        <IconSearch
          aria-hidden='true'
          className='h-4 w-4'
        />
      </Button>
    )
  }
}
