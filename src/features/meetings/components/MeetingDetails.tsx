import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ArrowLeft, 
  Video, 
  Users, 
  Calendar, 
  Clock, 
  FileVideo,
  Download,
  Trash2,
  Edit,
  Share2,
  Copy
} from 'lucide-react'
import { useMeetingStore } from '@/stores/meetingStore'
import { useAuthStore } from '@/stores/authStore'
import { Meeting, MeetingService } from '@/services/meetingService'
import { 
  formatMeetingDateTime, 
  formatDuration, 
  getMeetingStatusBadge, 
  getMeetingTypeBadge 
} from '@/utils/meetingUtils'
import { toast } from 'sonner'

export function MeetingDetails() {
  const { meetingId } = useParams({ from: '/_authenticated/meetings/$meetingId' })
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { fetchMeetingById, deleteMeeting, loading, error } = useMeetingStore()
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (meetingId) {
      fetchMeetingById(meetingId).then((fetchedMeeting) => {
        if (fetchedMeeting) {
          setMeeting(fetchedMeeting)
        }
      })
    }
  }, [meetingId, fetchMeetingById])

  const handleJoinMeeting = () => {
    if (meeting) {
      navigate({ to: '/meetings/room', search: { roomCode: meeting.roomCode } })
    }
  }

  const handleEditMeeting = () => {
    if (meeting) {
      navigate({ to: '/meetings/edit', search: { meetingId: meeting.id } })
    }
  }

  const handleDeleteMeeting = async () => {
    if (!meeting) return

    if (confirm('Are you sure you want to delete this meeting? This action cannot be undone.')) {
      try {
        await deleteMeeting(meeting.id)
        toast.success('Meeting deleted successfully!')
        navigate({ to: '/meetings' })
      } catch (error) {
        toast.error('Failed to delete meeting')
      }
    }
  }

  const handleCopyRoomCode = () => {
    if (meeting?.roomCode) {
      navigator.clipboard.writeText(meeting.roomCode)
      toast.success('Room code copied to clipboard!')
    }
  }

  const handleShareMeeting = () => {
    if (meeting) {
      const shareData = {
        title: meeting.title,
        text: `Join my meeting: ${meeting.title}`,
        url: `${window.location.origin}/meetings/join?roomCode=${meeting.roomCode}`
      }

      if (navigator.share) {
        navigator.share(shareData)
      } else {
        navigator.clipboard.writeText(shareData.url)
        toast.success('Meeting link copied to clipboard!')
      }
    }
  }

  const handleDownloadRecording = async (recordingId: string) => {
    try {
      // TODO: Implement recording download
      toast.success('Recording download started!')
    } catch (error) {
      toast.error('Failed to download recording')
    }
  }

  const handleDeleteRecording = async (recordingId: string) => {
    if (confirm('Are you sure you want to delete this recording?')) {
      try {
        // TODO: Implement recording deletion
        toast.success('Recording deleted successfully!')
      } catch (error) {
        toast.error('Failed to delete recording')
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading meeting details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Meeting Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The meeting you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => navigate({ to: '/meetings' })}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Meetings
          </Button>
        </div>
      </div>
    )
  }

  const isHost = MeetingService.isMeetingHost(meeting, user?.empRole === 'admin' ? 'admin' : 'user')
  const canEdit = MeetingService.isMeetingEditable(meeting, user?.empRole || '', user?.empRole === 'admin' ? 'admin' : 'user')
  const canJoin = MeetingService.isMeetingJoinable(meeting)

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/meetings' })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Meetings
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{meeting.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getMeetingStatusBadge(meeting.status)}
              {getMeetingTypeBadge(meeting.type)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {canJoin && (
            <Button onClick={handleJoinMeeting}>
              <Video className="w-4 h-4 mr-2" />
              Join Meeting
            </Button>
          )}
          
          {canEdit && (
            <Button variant="outline" onClick={handleEditMeeting}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          
          {isHost && (
            <Button variant="outline" onClick={handleDeleteMeeting}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Meeting Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date & Time</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {formatMeetingDateTime(meeting.scheduledStart)}
            </p>
            <p className="text-sm text-muted-foreground">
              Duration: {formatDuration(meeting.scheduledEnd.getTime() - meeting.scheduledStart.getTime())}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Participants</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {meeting.participants?.length || 0} participants
            </p>
            <p className="text-sm text-muted-foreground">
              Host: {meeting.hostName}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Room Code</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {meeting.roomCode}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyRoomCode}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShareMeeting}
              className="mt-2"
            >
              <Share2 className="w-3 h-3 mr-1" />
              Share
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">
                    {meeting.description || 'No description provided'}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Meeting Type</h3>
                  <p className="text-muted-foreground">
                    {meeting.type} - {meeting.type === 'BASIC' ? 'Basic meeting' : 
                                    meeting.type === 'NORMAL' ? 'Standard meeting' : 'Extended meeting'}
                  </p>
                </div>

                {meeting.password && (
                  <div>
                    <h3 className="font-medium mb-2">Password Protected</h3>
                    <p className="text-muted-foreground">
                      This meeting requires a password to join
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-medium mb-2">Schedule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Start Time</p>
                      <p className="text-sm text-muted-foreground">
                        {meeting.scheduledStart.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">End Time</p>
                      <p className="text-sm text-muted-foreground">
                        {meeting.scheduledEnd.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Participants</CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.participants && meeting.participants.length > 0 ? (
                <div className="space-y-3">
                  {meeting.participants.map((participant) => (
                    <div key={participant.empId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={participant.empProfile} />
                          <AvatarFallback>{participant.empName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{participant.empName}</p>
                          <p className="text-sm text-muted-foreground">{participant.empEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.empId === meeting.hostId && (
                          <Badge variant="default">Host</Badge>
                        )}
                        {participant.status === 'joined' && (
                          <Badge variant="secondary">Joined</Badge>
                        )}
                        {participant.status === 'invited' && (
                          <Badge variant="outline">Invited</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No participants yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recordings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Recordings</CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.recordings && meeting.recordings.length > 0 ? (
                <div className="space-y-3">
                  {meeting.recordings.map((recording) => (
                    <div key={recording.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileVideo className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{recording.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {recording.duration} • {recording.fileSize}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadRecording(recording.id)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                        {isHost && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRecording(recording.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileVideo className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No recordings available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}





