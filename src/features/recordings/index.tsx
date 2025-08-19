import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { IconSearch, IconLayoutList, IconLayoutGrid, IconEye, IconDownload, IconTrash } from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { screenshotService, Screenshot } from '@/services/screenshotService'
import { useAuth } from '@/stores/authStore'

export default function Screenshots() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch screenshots from API
  useEffect(() => {
    const fetchScreenshots = async () => {
      try {
        setLoading(true)
        const response = await screenshotService.getAllScreenshots()
        if (response.success && response.data) {
          setScreenshots(response.data.screenshots)
        }
      } catch (error) {
        console.error('Error fetching screenshots:', error)
        // Fallback to mock data for development
        setScreenshots([
          {
            id: '1',
            imageUrl: 'https://via.placeholder.com/800x600/2563eb/ffffff?text=Screenshot+1',
            createdAt: '2024-08-15T10:30:00Z',
            employee: {
              id: '1',
              empName: 'John Doe',
              email: 'john.doe@company.com',
              profilePic: '/avatars/01.png'
            }
          },
          {
            id: '2',
            imageUrl: 'https://via.placeholder.com/800x600/059669/ffffff?text=Screenshot+2',
            createdAt: '2024-08-15T10:25:00Z',
            employee: {
              id: '2',
              empName: 'Jane Smith',
              email: 'jane.smith@company.com',
              profilePic: '/avatars/02.png'
            }
          },
          {
            id: '3',
            imageUrl: 'https://via.placeholder.com/800x600/dc2626/ffffff?text=Screenshot+3',
            createdAt: '2024-08-15T10:20:00Z',
            employee: {
              id: '3',
              empName: 'Mike Johnson',
              email: 'mike.johnson@company.com',
              profilePic: '/avatars/03.png'
            }
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchScreenshots()
  }, [])

  const filteredScreenshots = screenshots.filter(screenshot => {
    return screenshot.employee.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           screenshot.employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const handleViewScreenshot = (screenshot: Screenshot) => {
    setSelectedScreenshot(screenshot)
    setIsDialogOpen(true)
  }

  const handleDownload = (screenshot: Screenshot) => {
    const link = document.createElement('a')
    link.href = screenshot.imageUrl
    link.download = `screenshot-${screenshot.id}.png`
    link.click()
  }

  const handleDelete = async (screenshotId: string) => {
    if (confirm('Are you sure you want to delete this screenshot?')) {
      try {
        await screenshotService.deleteScreenshot(screenshotId)
        setScreenshots(screenshots.filter(s => s.id !== screenshotId))
      } catch (error) {
        console.error('Error deleting screenshot:', error)
        alert('Failed to delete screenshot')
      }
    }
  }

  if (loading) {
    return (
      <Main>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading screenshots...</div>
        </div>
      </Main>
    )
  }

  return (
    <Main>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Employee Screenshots</h2>
            <p className='text-muted-foreground'>
              View and manage employee activity screenshots captured by the monitoring system.
            </p>
          </div>
        </div>

        {/* Search and Controls */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='relative'>
              <IconSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search by employee name or email...'
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
        {filteredScreenshots.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">No screenshots found</div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredScreenshots.map((screenshot) => (
              <div key={screenshot.id} className='bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow'>
                {/* Screenshot Thumbnail */}
                <div className='relative'>
                  <img 
                    src={screenshot.imageUrl} 
                    alt={`Screenshot by ${screenshot.employee.empName}`}
                    className='w-full h-48 object-cover cursor-pointer'
                    onClick={() => handleViewScreenshot(screenshot)}
                  />
                  <div className='absolute top-2 right-2 flex space-x-1'>
                    <Button 
                      size='sm' 
                      variant='secondary' 
                      className='h-8 w-8 p-0'
                      onClick={() => handleViewScreenshot(screenshot)}
                    >
                      <IconEye className='h-4 w-4' />
                    </Button>
                    <Button 
                      size='sm' 
                      variant='secondary' 
                      className='h-8 w-8 p-0'
                      onClick={() => handleDownload(screenshot)}
                    >
                      <IconDownload className='h-4 w-4' />
                    </Button>
                    <Button 
                      size='sm' 
                      variant='destructive' 
                      className='h-8 w-8 p-0'
                      onClick={() => handleDelete(screenshot.id)}
                    >
                      <IconTrash className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
                
                {/* Card Content */}
                <div className='p-4'>
                  <div className='flex items-center space-x-3 mb-3'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={screenshot.employee.profilePic} alt={screenshot.employee.empName} />
                      <AvatarFallback>{screenshot.employee.empName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className='font-semibold'>{screenshot.employee.empName}</h3>
                      <p className='text-sm text-muted-foreground'>{screenshot.employee.email}</p>
                    </div>
                  </div>
                  
                  <p className='text-muted-foreground text-sm'>{formatDate(screenshot.createdAt)}</p>
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
                    <th className='text-left p-4 font-medium'>Employee</th>
                    <th className='text-left p-4 font-medium'>Screenshot</th>
                    <th className='text-left p-4 font-medium'>Captured At</th>
                    <th className='text-left p-4 font-medium'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScreenshots.map((screenshot) => (
                    <tr key={screenshot.id} className='border-b hover:bg-muted/50'>
                      <td className='p-4'>
                        <div className='flex items-center space-x-3'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage src={screenshot.employee.profilePic} alt={screenshot.employee.empName} />
                            <AvatarFallback>{screenshot.employee.empName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className='font-medium'>{screenshot.employee.empName}</div>
                            <div className='text-sm text-muted-foreground'>{screenshot.employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className='p-4'>
                        <img 
                          src={screenshot.imageUrl} 
                          alt={`Screenshot by ${screenshot.employee.empName}`}
                          className='w-20 h-12 object-cover rounded cursor-pointer'
                          onClick={() => handleViewScreenshot(screenshot)}
                        />
                      </td>
                      <td className='p-4 text-muted-foreground'>{formatDate(screenshot.createdAt)}</td>
                      <td className='p-4'>
                        <div className='flex space-x-2'>
                          <Button 
                            size='sm' 
                            variant='outline'
                            onClick={() => handleViewScreenshot(screenshot)}
                          >
                            <IconEye className='h-4 w-4 mr-2' />
                            View
                          </Button>
                          <Button 
                            size='sm' 
                            variant='outline'
                            onClick={() => handleDownload(screenshot)}
                          >
                            <IconDownload className='h-4 w-4 mr-2' />
                            Download
                          </Button>
                          <Button 
                            size='sm' 
                            variant='destructive'
                            onClick={() => handleDelete(screenshot.id)}
                          >
                            <IconTrash className='h-4 w-4 mr-2' />
                            Delete
                          </Button>
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

      {/* Screenshot View Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Screenshot by {selectedScreenshot?.employee.empName}
            </DialogTitle>
          </DialogHeader>
          {selectedScreenshot && (
            <div className="space-y-4">
              <img 
                src={selectedScreenshot.imageUrl} 
                alt={`Screenshot by ${selectedScreenshot.employee.empName}`}
                className="w-full rounded-lg"
              />
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Captured on {formatDate(selectedScreenshot.createdAt)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => handleDownload(selectedScreenshot)}
                  >
                    <IconDownload className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      handleDelete(selectedScreenshot.id)
                      setIsDialogOpen(false)
                    }}
                  >
                    <IconTrash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Main>
  )
}