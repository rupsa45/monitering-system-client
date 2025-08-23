import React, { useEffect, useState } from 'react'
import { useMeetingStore } from '@/stores/meetingStore'
// import { useAuthStore } from '@/stores/authStore'
import { Meeting } from '@/services/meetingService'
import { 
  formatMeetingDateTime, 
  formatDuration, 
  getMeetingStatusBadge, 
  getMeetingTypeBadge,
  isMeetingStartingSoon,
  isMeetingInPast
} from '@/utils/meetingUtils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Video, Grid, List, Plus, Search, Filter } from 'lucide-react'
import { MeetingCard } from './MeetingCard'
import { MeetingTable } from './MeetingTable'
import { CreateMeetingModal } from './CreateMeetingModal'
import { JoinMeetingModal } from './JoinMeetingModal'

interface MeetingListProps {
  userRole?: 'admin' | 'employee'
  showCreateButton?: boolean
  showFilters?: boolean
  showUpcomingOnly?: boolean
}

export const MeetingList: React.FC<MeetingListProps> = ({
  userRole = 'employee',
  showCreateButton = true,
  showFilters = true,
  showUpcomingOnly = false
}) => {
  const {
    meetings,
    upcomingMeetings,
    loading,
    error,
    filters,
    viewMode,
    selectedMeetings,
    showCreateModal,
    showJoinModal,
    fetchMeetings,
    fetchMyMeetings,
    fetchUpcomingMeetings,
    setFilters,
    setViewMode,
    selectMeeting,
    deselectMeeting,
    selectAllMeetings,
    deselectAllMeetings,
    toggleCreateModal,
    toggleJoinModal,
    clearError
  } = useMeetingStore()

  // const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  // Determine which meetings to show
  const displayMeetings = showUpcomingOnly ? upcomingMeetings : meetings

  // Filter meetings based on search and filters
  const filteredMeetings = displayMeetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         meeting.roomCode.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || meeting.status === statusFilter
    const matchesType = !typeFilter || meeting.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Load meetings on component mount
  useEffect(() => {
    if (showUpcomingOnly) {
      fetchUpcomingMeetings()
    } else {
      if (userRole === 'admin') {
        fetchMeetings(filters)
      } else {
        fetchMyMeetings(filters)
      }
    }
  }, [userRole, showUpcomingOnly, filters])

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  // Handle status filter
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    if (value) {
      setFilters({ status: value as Meeting['status'] })
    } else {
      setFilters({ status: undefined })
    }
  }

  // Handle type filter
  const handleTypeFilter = (value: string) => {
    setTypeFilter(value)
    if (value) {
      setFilters({ type: value as Meeting['type'] })
    } else {
      setFilters({ type: undefined })
    }
  }

  // Handle bulk actions
  const handleBulkDelete = async () => {
    // Implementation for bulk delete
    // Bulk delete selected meetings
  }

  const handleBulkStart = async () => {
    // Implementation for bulk start
    // Bulk start selected meetings
  }

  // Handle meeting selection
  const handleMeetingSelect = (meetingId: string, selected: boolean) => {
    if (selected) {
      selectMeeting(meetingId)
    } else {
      deselectMeeting(meetingId)
    }
  }

  // Handle meeting actions
  const handleJoinMeeting = (_meeting: Meeting) => {
    // Implementation for joining meeting
    // Join meeting
  }

  const handleEditMeeting = (_meeting: Meeting) => {
    // Implementation for editing meeting
    // Edit meeting
  }

  const handleDeleteMeeting = async (_meeting: Meeting) => {
    // Implementation for deleting meeting
    // Delete meeting
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600">
            <span className="font-medium">Error:</span> {error}
          </div>
          <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
            Dismiss
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {showUpcomingOnly ? 'Upcoming Meetings' : 'Meetings'}
          </h2>
          <p className="text-gray-600">
            {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Create Meeting Button */}
          {showCreateButton && (
            <Button onClick={() => toggleCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Meeting
            </Button>
          )}

          {/* Join Meeting Button */}
          <Button variant="outline" onClick={() => toggleJoinModal(true)}>
            <Video className="h-4 w-4 mr-2" />
            Join Meeting
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="LIVE">Live</SelectItem>
                  <SelectItem value="ENDED">Ended</SelectItem>
                  <SelectItem value="CANCELED">Canceled</SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={handleTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="LONG">Long</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                  setTypeFilter('')
                  setFilters({})
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedMeetings.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedMeetings.length} meeting{selectedMeetings.length !== 1 ? 's' : ''} selected
                </span>
                <Button variant="ghost" size="sm" onClick={deselectAllMeetings}>
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleBulkStart}>
                  Start Selected
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meetings Display */}
      {filteredMeetings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter || typeFilter
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by creating your first meeting.'}
              </p>
              {showCreateButton && (
                <Button onClick={() => toggleCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Meeting
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  userRole={userRole}
                  selected={selectedMeetings.includes(meeting.id)}
                  onSelect={handleMeetingSelect}
                  onJoin={handleJoinMeeting}
                  onEdit={handleEditMeeting}
                  onDelete={handleDeleteMeeting}
                />
              ))}
            </div>
          ) : (
            <MeetingTable
              meetings={filteredMeetings}
              userRole={userRole}
              selectedMeetings={selectedMeetings}
              onSelect={handleMeetingSelect}
              onSelectAll={selectAllMeetings}
              onDeselectAll={deselectAllMeetings}
              onJoin={handleJoinMeeting}
              onEdit={handleEditMeeting}
              onDelete={handleDeleteMeeting}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <CreateMeetingModal
        open={showCreateModal}
        onOpenChange={toggleCreateModal}
        userRole={userRole}
      />
      
      <JoinMeetingModal
        open={showJoinModal}
        onOpenChange={toggleJoinModal}
      />
    </div>
  )
}
