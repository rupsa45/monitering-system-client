import React from 'react'
import { Meeting } from '@/services/meetingService'
import { 
  formatMeetingDateTime, 
  formatDuration, 
  getMeetingStatusBadge, 
  getMeetingTypeBadge,
  isMeetingStartingSoon,
  isMeetingInPast
} from '@/utils/meetingUtils'
import { MeetingService } from '@/services/meetingService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  Edit, 
  Trash2, 
  MoreVertical,
  AlertCircle,
  Play,
  Stop
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

interface MeetingCardProps {
  meeting: Meeting
  userRole?: 'admin' | 'employee'
  selected?: boolean
  onSelect?: (meetingId: string, selected: boolean) => void
  onJoin?: (meeting: Meeting) => void
  onEdit?: (meeting: Meeting) => void
  onDelete?: (meeting: Meeting) => void
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  userRole = 'employee',
  selected = false,
  onSelect,
  onJoin,
  onEdit,
  onDelete
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Get status and type badges
  const statusBadge = getMeetingStatusBadge(meeting.status)
  const typeBadge = getMeetingTypeBadge(meeting.type)

  // Check if meeting is starting soon
  const startingSoon = isMeetingStartingSoon(meeting)
  const isPast = isMeetingInPast(meeting)

  // Check user permissions
  const isHost = MeetingService.isMeetingHost(meeting, userRole === 'admin' ? 'admin' : 'user')
      // const isParticipant = MeetingService.isMeetingParticipant(meeting, userRole === 'admin' ? 'admin' : 'user')
  const canEdit = MeetingService.isMeetingEditable(meeting, userRole, userRole === 'admin' ? 'admin' : 'user')
  const canJoin = MeetingService.isMeetingJoinable(meeting)

  // Handle delete
  const handleDelete = async () => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete(meeting)
      setShowDeleteDialog(false)
    } catch (error) {
      // Failed to delete meeting
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle join
  const handleJoin = () => {
    if (onJoin) {
      onJoin(meeting)
    }
  }

  // Handle edit
  const handleEdit = () => {
    if (onEdit) {
      onEdit(meeting)
    }
  }

  return (
    <>
      <Card className={`relative transition-all duration-200 hover:shadow-lg ${
        selected ? 'ring-2 ring-primary' : ''
      } ${startingSoon ? 'border-orange-200 bg-orange-50' : ''}`}>
        {/* Selection Checkbox */}
        {onSelect && (
          <div className="absolute top-3 left-3 z-10">
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect(meeting.id, checked as boolean)}
            />
          </div>
        )}

        {/* Starting Soon Alert */}
        {startingSoon && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              Starting Soon
            </Badge>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {meeting.title}
              </CardTitle>
              {meeting.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {meeting.description}
                </p>
              )}
            </div>
            
            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canJoin && (
                  <DropdownMenuItem onClick={handleJoin}>
                    <Video className="h-4 w-4 mr-2" />
                    Join Meeting
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
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
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Meeting
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-3">
            <Badge className={statusBadge.color}>
              {statusBadge.icon} {statusBadge.label}
            </Badge>
            <Badge variant="outline">
              {typeBadge.icon} {typeBadge.label}
            </Badge>
            {meeting.password && (
              <Badge variant="outline" className="text-xs">
                🔒 Password Protected
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Meeting Details */}
          <div className="space-y-3">
            {/* Date and Time */}
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                {formatMeetingDateTime(meeting.scheduledStart || '')}
              </span>
            </div>

            {/* Duration */}
            {meeting.scheduledStart && meeting.scheduledEnd && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>
                  {formatDuration(meeting.scheduledStart, meeting.scheduledEnd)}
                </span>
              </div>
            )}

            {/* Participants */}
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Host */}
            <div className="text-sm text-gray-600">
              <span className="font-medium">Host:</span> {meeting.host.empName}
            </div>

            {/* Room Code */}
            <div className="text-sm">
              <span className="font-medium text-gray-700">Room Code:</span>
              <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                {meeting.roomCode}
              </code>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            {canJoin ? (
              <Button 
                onClick={handleJoin} 
                className="flex-1"
                size="sm"
              >
                <Video className="h-4 w-4 mr-2" />
                {meeting.status === 'LIVE' ? 'Join Live' : 'Join Meeting'}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="flex-1" 
                size="sm"
                disabled
              >
                {isPast ? 'Meeting Ended' : 'Not Available'}
              </Button>
            )}

            {canEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{meeting.title}"? This action cannot be undone.
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
