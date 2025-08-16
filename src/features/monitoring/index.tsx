import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  IconSearch, 
  IconLayoutList, 
  IconLayoutGrid, 
  IconFilter,
  IconUsers,
  IconCoffee,
  IconUserOff,
  IconClock
} from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'

// Mock data for monitoring
const users = [
  {
    id: 1,
    name: 'Olivia Martin',
    role: 'User',
    status: 'active',
    avatar: '/avatars/01.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    role: 'User',
    status: 'active',
    avatar: '/avatars/02.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'William Kim',
    role: 'User',
    status: 'break',
    avatar: '/avatars/03.png',
    initials: 'WK'
  },
  {
    id: 4,
    name: 'Sofia Davis',
    role: 'User',
    status: 'active',
    avatar: '/avatars/04.png',
    initials: 'SD'
  },
  {
    id: 5,
    name: 'Emma Wilson',
    role: 'User',
    status: 'offline',
    avatar: '/avatars/05.png',
    initials: 'EW'
  },
  {
    id: 6,
    name: 'Michael Brown',
    role: 'User',
    status: 'away',
    avatar: '/avatars/06.png',
    initials: 'MB'
  }
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className='bg-green-500 hover:bg-green-600'>Active</Badge>
    case 'break':
      return <Badge className='bg-orange-500 hover:bg-orange-600'>On Break</Badge>  // Updated color
    case 'offline':
      return <Badge variant='destructive'>Offline</Badge>
    case 'away':
      return <Badge variant='secondary'>Away</Badge>
    default:
      return <Badge variant='secondary'>{status}</Badge>
  }
}

const _getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <IconUsers className='h-4 w-4' />
    case 'break':
      return <IconCoffee className='h-4 w-4' />
    case 'offline':
      return <IconUserOff className='h-4 w-4' />
    case 'away':
      return <IconClock className='h-4 w-4' />
    default:
      return <IconUsers className='h-4 w-4' />
  }
}

export default function Monitoring() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    active: true,
    break: true,
    offline: true,
    away: true
  })

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Status filter
    const statusKey = user.status === 'break' ? 'break' : user.status
    const matchesStatus = filters[statusKey as keyof typeof filters]
    
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
      active: false,
      break: false,
      offline: false,
      away: false
    })
  }

  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === 'active').length
  const onBreakUsers = users.filter(u => u.status === 'break').length
  const offlineUsers = users.filter(u => u.status === 'offline').length
  const awayUsers = users.filter(u => u.status === 'away').length

  return (
    <Main>
      <div className='space-y-6'>
        {/* Header */}
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>User Monitoring</h2>
          <p className='text-muted-foreground'>
            A real-time view of currently active user sessions.
          </p>
        </div>

        {/* Summary Cards */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Users
              </CardTitle>
              <IconUsers className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{totalUsers}</div>
              <p className='text-xs text-muted-foreground'>
                All registered users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Active
              </CardTitle>
              <IconUsers className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{activeUsers}</div>
              <p className='text-xs text-muted-foreground'>
                Currently active users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                On Break
              </CardTitle>
              <IconCoffee className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{onBreakUsers}</div>
              <p className='text-xs text-muted-foreground'>
                Users currently on break
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Offline
              </CardTitle>
              <IconUserOff className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{offlineUsers}</div>
              <p className='text-xs text-muted-foreground'>
                Users currently offline
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Away
              </CardTitle>
              <IconClock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{awayUsers}</div>
              <p className='text-xs text-muted-foreground'>
                Users currently away
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Controls */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='relative'>
              <IconSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search by name...'
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
              className={viewMode === 'list' ? 'bg-black hover:bg-gray-800 text-white border-black' : ''}
              onClick={() => setViewMode('list')}
            >
              <IconLayoutList className='h-4 w-4' />
            </Button>
            <Button 
              variant='outline' 
              size='icon'
              className={viewMode === 'grid' ? 'bg-black hover:bg-gray-800 text-white border-black' : ''}
              onClick={() => setViewMode('grid')}
            >
              <IconLayoutGrid className='h-4 w-4' />
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
                        id='active'
                        checked={filters.active}
                        onCheckedChange={() => handleFilterChange('active')}
                      />
                      <label htmlFor='active' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        Active
                      </label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox 
                        id='break'
                        checked={filters.break}
                        onCheckedChange={() => handleFilterChange('break')}
                      />
                      <label htmlFor='break' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        On Break
                      </label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox 
                        id='offline'
                        checked={filters.offline}
                        onCheckedChange={() => handleFilterChange('offline')}
                      />
                      <label htmlFor='offline' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        Offline
                      </label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox 
                        id='away'
                        checked={filters.away}
                        onCheckedChange={() => handleFilterChange('away')}
                      />
                      <label htmlFor='away' className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        Away
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
            {filteredUsers.map((user) => (
              <div key={user.id} className='bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow'>
                {/* Screen Share Placeholder */}
                <div className='bg-muted h-48 flex items-center justify-center'>
                  <div className='text-muted-foreground text-sm'>1280 x 720</div>
                </div>
                
                {/* User Info */}
                <div className='p-4'>
                  <div className='flex items-center space-x-3 mb-3'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className='text-xs'>{user.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className='font-semibold'>{user.name}</h3>
                      <p className='text-sm text-muted-foreground'>{user.role}</p>
                    </div>
                  </div>
                  
                  <div className='flex justify-center'>
                    {getStatusBadge(user.status)}
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
                    <th className='text-left p-4 font-medium'>User</th>
                    <th className='text-left p-4 font-medium'>Role</th>
                    <th className='text-left p-4 font-medium'>Status</th>
                    <th className='text-left p-4 font-medium'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className='border-b hover:bg-muted/50'>
                      <td className='p-4'>
                        <div className='flex items-center space-x-3'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.initials}</AvatarFallback>
                          </Avatar>
                          <span className='font-medium'>{user.name}</span>
                        </div>
                      </td>
                      <td className='p-4 text-muted-foreground'>{user.role}</td>
                      <td className='p-4'>
                        {getStatusBadge(user.status)}
                      </td>
                      <td className='p-4'>
                        <Button size='sm' variant='outline'>
                          View Details
                        </Button>
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