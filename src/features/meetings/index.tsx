import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback,  } from '@/components/ui/avatar'
import {  
  IconSearch, 
  IconLayoutList, 
  IconLayoutGrid, 
  IconFilter,
  IconVideo,
  IconDotsVertical,
  IconPlus
} from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'

// Mock data for meetings
const meetings = [
  {
    id: 1,
    title: 'Q3 Project Kickoff',
    client: 'Acme Inc.',
    date: '2024-08-15 at 10:00 AM',
    status: 'scheduled'
  },
  {
    id: 2,
    title: 'Product Demo',
    client: 'Stark Industries',
    date: '2024-08-15 at 02:00 PM',
    status: 'scheduled'
  },
  {
    id: 3,
    title: 'Contract Renewal',
    client: 'Wayne Enterprises',
    date: '2024-08-14 at 11:30 AM',
    status: 'ended'
  },
  {
    id: 4,
    title: 'Weekly Standup',
    client: 'Internal Sync',
    date: '2024-08-16 at 09:00 AM',
    status: 'scheduled'
  },
  {
    id: 5,
    title: 'Follow-up Discussion',
    client: 'Stark Industries',
    date: '2024-08-12 at 03:00 PM',
    status: 'ended'
  },
  {
    id: 6,
    title: 'Live Demo',
    client: 'Live Demo',
    date: '2024-08-20 at 11:00 AM',
    status: 'live'
  }
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'scheduled':
      return <Badge className='bg-yellow-500 hover:bg-yellow-600'>Scheduled</Badge>
    case 'live':
      return <Badge variant='destructive'>Live</Badge>
    case 'ended':
      return <span className='text-muted-foreground'>Ended</span>
    default:
      return <Badge variant='secondary'>{status}</Badge>
  }
}

export default function Meetings() {
  const [filters, setFilters] = useState({
    scheduled: true,
    live: true,
    ended: true
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredMeetings = meetings.filter(meeting => {
    // Search filter
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.client.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Status filter
    const matchesStatus = filters[meeting.status as keyof typeof filters]
    
    return matchesSearch && matchesStatus
  })

  const handleFilterChange = (status: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }))
  }

  const clearFilters = () => {
    setFilters({
      scheduled: false,
      live: false,
      ended: false
    })
  }

  return (
    <Main>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Meetings</h2>
            <p className='text-muted-foreground'>
              Manage all client and team meetings.
            </p>
          </div>
          <Button className='bg-black hover:bg-gray-800 text-white'>
            <IconPlus className='h-4 w-4 mr-2' />
            Schedule Meeting
          </Button>
        </div>

        {/* Search and Controls */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='relative'>
              <IconSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search by title or client...'
                className='pl-10 w-80'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Button 
              variant='outline' 
              size='icon'
              className={viewMode === 'grid' ? 'bg-black hover:bg-gray-800 text-white border-black' : ''}
              onClick={() => setViewMode('grid')}
            >
              <IconLayoutGrid className='h-4 w-4' />
            </Button>
            <Button 
              variant='outline' 
              size='icon'
              className={viewMode === 'list' ? 'bg-black hover:bg-gray-800 text-white border-black' : ''}
              onClick={() => setViewMode('list')}
            >
              <IconLayoutList className='h-4 w-4' />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' className='flex items-center space-x-2'>
                  <IconFilter className='h-4 w-4' />
                  <span>Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <div className='p-2'>
                  <h4 className='font-medium mb-2'>Filter by Status</h4>
                  <div className='space-y-2'>
                    <div className='flex items-center space-x-2'>
                      <Checkbox 
                        id='scheduled'
                        checked={filters.scheduled}
                        onCheckedChange={() => handleFilterChange('scheduled')}
                      />
                      <label htmlFor='scheduled' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        Scheduled
                      </label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox 
                        id='live'
                        checked={filters.live}
                        onCheckedChange={() => handleFilterChange('live')}
                      />
                      <label htmlFor='live' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        Live
                      </label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox 
                        id='ended'
                        checked={filters.ended}
                        onCheckedChange={() => handleFilterChange('ended')}
                      />
                      <label htmlFor='ended' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        Ended
                      </label>
                    </div>
                  </div>
                  <DropdownMenuSeparator className='my-2' />
                  <Button 
                    variant='ghost' 
                    size='sm' 
                    className='w-full justify-start'
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'grid' ? (
          /* Grid View */
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredMeetings.map((meeting) => (
              <div key={meeting.id} className='bg-card border rounded-lg p-4 hover:shadow-md transition-shadow'>
                <div className='flex justify-between items-start mb-3'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-lg mb-1'>{meeting.title}</h3>
                    <p className='text-muted-foreground text-sm'>with {meeting.client}</p>
                  </div>
                  <div className='ml-2'>
                    {getStatusBadge(meeting.status)}
                  </div>
                </div>
                
                <p className='text-muted-foreground text-sm mb-4'>{meeting.date}</p>
                
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Avatar className='h-6 w-6'>
                      <AvatarFallback className='text-xs'>
                        {meeting.client.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className='text-sm text-muted-foreground'>{meeting.client}</span>
                  </div>
                  
                  <div className='flex items-center space-x-2'>
                    {(meeting.status === 'scheduled' || meeting.status === 'live') && (
                      <Button size='sm' className='bg-yellow-500 hover:bg-yellow-600 text-white'>
                        <IconVideo className='h-4 w-4 mr-1' />
                        Join
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='sm'>
                          <IconDotsVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem>Edit Meeting</DropdownMenuItem>
                        <DropdownMenuItem>Reschedule</DropdownMenuItem>
                        <DropdownMenuItem>Cancel Meeting</DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className='rounded-lg border'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b bg-muted/50'>
                    <th className='text-left p-4 font-medium'>Meeting</th>
                    <th className='text-left p-4 font-medium'>Date & Time</th>
                    <th className='text-left p-4 font-medium'>Status</th>
                    <th className='text-left p-4 font-medium'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeetings.map((meeting) => (
                    <tr key={meeting.id} className='border-b hover:bg-muted/50'>
                      <td className='p-4'>
                        <div>
                          <div className='font-medium'>{meeting.title}</div>
                          <div className='text-muted-foreground'>{meeting.client}</div>
                        </div>
                      </td>
                      <td className='p-4 text-muted-foreground'>{meeting.date}</td>
                      <td className='p-4'>
                        {getStatusBadge(meeting.status)}
                      </td>
                      <td className='p-4'>
                        <div className='flex items-center space-x-2'>
                          {(meeting.status === 'scheduled' || meeting.status === 'live') && (
                            <Button size='sm' className='bg-yellow-500 hover:bg-yellow-600 text-white'>
                              <IconVideo className='h-4 w-4 mr-2' />
                              Join
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm'>
                                <IconDotsVertical className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem>Edit Meeting</DropdownMenuItem>
                              <DropdownMenuItem>Reschedule</DropdownMenuItem>
                              <DropdownMenuItem>Cancel Meeting</DropdownMenuItem>
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Main>
  )
}