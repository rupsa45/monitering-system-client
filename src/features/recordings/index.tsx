import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { IconSearch, IconLayoutList, IconLayoutGrid, IconPlayerPlay } from '@tabler/icons-react'
import { useState } from 'react'

// Mock data for recordings
const recordings = [
  {
    id: 1,
    session: 'Project Alpha Kickoff',
    user: {
      name: 'Olivia Martin',
      avatar: '/avatars/01.png',
      initials: 'OM'
    },
    date: '2024-08-01',
    duration: '45:12',
    status: 'processed'
  },
  {
    id: 2,
    session: 'Q3 Marketing Sync',
    user: {
      name: 'Jackson Lee',
      avatar: '/avatars/02.png',
      initials: 'JL'
    },
    date: '2024-07-30',
    duration: '30:50',
    status: 'processed'
  },
  {
    id: 3,
    session: 'Design Review - New Dashboard',
    user: {
      name: 'Isabella Nguyen',
      avatar: '/avatars/03.png',
      initials: 'IN'
    },
    date: '2024-07-29',
    duration: '1:12:34',
    status: 'processing'
  },
  {
    id: 4,
    session: 'Weekly Standup',
    user: {
      name: 'William Kim',
      avatar: '/avatars/04.png',
      initials: 'WK'
    },
    date: '2024-07-28',
    duration: '15:22',
    status: 'failed'
  },
  {
    id: 5,
    session: 'User Interview - Sofia',
    user: {
      name: 'Sofia Davis',
      avatar: '/avatars/05.png',
      initials: 'SD'
    },
    date: '2024-07-27',
    duration: '25:00',
    status: 'processed'
  }
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'processed':
      return <Badge className='bg-green-500 hover:bg-green-600'>Processed</Badge>
    case 'processing':
      return <Badge className='bg-yellow-500 hover:bg-yellow-600'>Processing</Badge>
    case 'failed':
      return <Badge className='bg-red-500 hover:bg-red-600'>Failed</Badge>
    default:
      return <Badge className='bg-gray-500 hover:bg-gray-600'>{status}</Badge>
  }
}

export default function Recordings() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredRecordings = recordings.filter(recording => {
    return recording.session.toLowerCase().includes(searchTerm.toLowerCase()) ||
           recording.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <Main>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>All Recordings</h2>
            <p className='text-muted-foreground'>
              Listen to and manage all user session recordings.
            </p>
          </div>
        </div>

        {/* Search and Controls */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='relative'>
              <IconSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search recordings...'
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
          </div>
        </div>

        {/* Content */}
        {viewMode === 'grid' ? (
          /* Grid View */
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredRecordings.map((recording) => (
              <div key={recording.id} className='bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow'>
                {/* Thumbnail Placeholder */}
                <div className='bg-muted h-48 flex items-center justify-center'>
                  <div className='text-muted-foreground text-sm'>320 x 180</div>
                </div>
                
                {/* Card Content */}
                <div className='p-4'>
                  <div className='flex justify-between items-start mb-3'>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-lg mb-1'>{recording.session}</h3>
                    </div>
                    <div className='ml-2'>
                      {getStatusBadge(recording.status)}
                    </div>
                  </div>
                  
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center space-x-2'>
                      <Avatar className='h-6 w-6'>
                        <AvatarImage src={recording.user.avatar} alt={recording.user.name} />
                        <AvatarFallback className='text-xs'>{recording.user.initials}</AvatarFallback>
                      </Avatar>
                      <span className='text-sm text-muted-foreground'>{recording.user.name}</span>
                    </div>
                    <Badge variant='secondary' className='text-xs'>
                      {recording.duration}
                    </Badge>
                  </div>
                  
                  <p className='text-muted-foreground text-sm mb-4'>{recording.date}</p>
                  
                  <Button size='sm' className='w-full bg-black hover:bg-gray-800 text-white'>
                    <IconPlayerPlay className='h-4 w-4 mr-2' />
                    Listen
                  </Button>
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
                    <th className='text-left p-4 font-medium'>Session</th>
                    <th className='text-left p-4 font-medium'>User</th>
                    <th className='text-left p-4 font-medium'>Date</th>
                    <th className='text-left p-4 font-medium'>Duration</th>
                    <th className='text-left p-4 font-medium'>Status</th>
                    <th className='text-left p-4 font-medium'>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecordings.map((recording) => (
                    <tr key={recording.id} className='border-b hover:bg-muted/50'>
                      <td className='p-4 font-medium'>{recording.session}</td>
                      <td className='p-4'>
                        <div className='flex items-center space-x-3'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage src={recording.user.avatar} alt={recording.user.name} />
                            <AvatarFallback>{recording.user.initials}</AvatarFallback>
                          </Avatar>
                          <span className='font-medium'>{recording.user.name}</span>
                        </div>
                      </td>
                      <td className='p-4 text-muted-foreground'>{recording.date}</td>
                      <td className='p-4 text-muted-foreground'>{recording.duration}</td>
                      <td className='p-4'>
                        {getStatusBadge(recording.status)}
                      </td>
                      <td className='p-4'>
                        <Button size='sm' variant='outline'>
                          <IconPlayerPlay className='h-4 w-4 mr-2' />
                          Listen
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