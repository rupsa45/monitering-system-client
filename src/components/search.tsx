import { IconSearch } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useSearch } from '@/context/search-context'
import { Button } from './ui/button'

interface Props {
  className?: string
  type?: React.HTMLInputTypeAttribute
  placeholder?: string
}

export function Search({ className = '', placeholder = 'Search' }: Props) {
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
}
