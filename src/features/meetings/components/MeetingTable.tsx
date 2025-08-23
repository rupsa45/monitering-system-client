import React from 'react'
import { Meeting } from '@/services/meetingService'
import { 
  formatMeetingDateTime, 
  formatDuration, 
  getMeetingStatusBadge, 
  getMeetingTypeBadge,
  isMeetingStartingSoon
} from '@/utils/meetingUtils'
import { MeetingService } from '@/services/meetingService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Video, 
  Edit, 
  Trash2, 
  MoreVertical,
  AlertCircle,
  Play,
  Stop,
  Users,
  Calendar,
  Clock
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useState } from 'react'

interface MeetingTableProps {
  meetings: Meeting[]
  userRole?: 'admin' | 'employee'
  selectedMeetings: string[]
  onSelect: (meetingId: string, selected: boolean) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onJoin: (meeting: Meeting) => void
  onEdit: (meeting: Meeting) => void
  onDelete: (meeting: Meeting) => void
}

export const MeetingTable: React.FC<MeetingTableProps> = ({
  meetings,
  userRole = 'employee',
  selectedMeetings,
  onSelect,
  onSelectAll,
  onDeselectAll,
  onJoin,
  onEdit,
  onDelete
}) => {
  const [deleteMeeting, setDeleteMeeting] = useState<Meeting | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Check if all meetings are selected
  const allSelected = meetings.length > 0 && selectedMeetings.length === meetings.length
  const someSelected = selectedMeetings.length > 0 && selectedMeetings.length < meetings.length

  // Handle select all
  const handleSelectAll = () => {
    if (allSelected) {
      onDeselectAll()
    } else {
      onSelectAll()
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deleteMeeting) return
    
    setIsDeleting(true)
    try {
      await onDelete(deleteMeeting)
      setDeleteMeeting(null)
    } catch (error) {
      // Failed to delete meeting
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Meeting</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Host</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map((meeting) => {
              const statusBadge = getMeetingStatusBadge(meeting.status)
              const typeBadge = getMeetingTypeBadge(meeting.type)
              const startingSoon = isMeetingStartingSoon(meeting)
              
              // Check user permissions
              const isHost = MeetingService.isMeetingHost(meeting, userRole === 'admin' ? 'admin' : 'user')
              const canEdit = MeetingService.isMeetingEditable(meeting, userRole, userRole === 'admin' ? 'admin' : 'user')
              const canJoin = MeetingService.isMeetingJoinable(meeting)

              return (
                <TableRow 
                  key={meeting.id}
                  className={`${startingSoon ? 'bg-orange-50' : ''} ${
                    selectedMeetings.includes(meeting.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedMeetings.includes(meeting.id)}
                      onCheckedChange={(checked) => onSelect(meeting.id, checked as boolean)}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 truncate">
                            {meeting.title}
                          </h4>
                          {startingSoon && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Soon
                            </Badge>
                          )}
                          {meeting.password && (
                            <Badge variant="outline" className="text-xs">
                              🔒
                            </Badge>
                          )}
                        </div>
                        {meeting.description && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {meeting.description}
                          </p>
                        )}
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          Room: {meeting.roomCode}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>
                        {formatMeetingDateTime(meeting.scheduledStart || '')}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>
                        {meeting.scheduledStart && meeting.scheduledEnd
                          ? formatDuration(meeting.scheduledStart, meeting.scheduledEnd)
                          : 'TBD'
                        }
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {meeting.host.empName}
                      </div>
                      <div className="text-gray-500">
                        {meeting.host.empEmail}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>
                        {meeting.participants.length}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={statusBadge.color}>
                      {statusBadge.icon} {statusBadge.label}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      {typeBadge.icon} {typeBadge.label}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canJoin && (
                          <DropdownMenuItem onClick={() => onJoin(meeting)}>
                            <Video className="h-4 w-4 mr-2" />
                            Join Meeting
                          </DropdownMenuItem>
                        )}
                        {canEdit && (
                          <DropdownMenuItem onClick={() => onEdit(meeting)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Meeting
                          </DropdownMenuItem>
                        )}
                        {isHost && meeting.status === 'SCHEDULED' && (
                          <DropdownMenuItem>
                            <Play className="h-4 w-4 mr-2" />
                            Start Meeting
                          </DropdownMenuItem>
                        )}
                        {isHost && meeting.status === 'LIVE' && (
                          <DropdownMenuItem>
                            <Stop className="h-4 w-4 mr-2" />
                            End Meeting
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {canEdit && (
                          <DropdownMenuItem 
                            onClick={() => setDeleteMeeting(meeting)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Meeting
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMeeting} onOpenChange={() => setDeleteMeeting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteMeeting?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
