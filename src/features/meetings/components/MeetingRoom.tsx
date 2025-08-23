import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { WebRTCIntegration } from '@/components/webrtc/WebRTCIntegration'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Settings,
  Users,
  Share,
  MoreVertical,
  MessageSquare,
  FileText,
  Download,
  AlertCircle,
  Activity,
  BarChart3,
  Monitor,
  MonitorOff
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface MeetingRoomProps {
  roomCode?: string
  meetingId?: string
  isHost?: boolean
}

export function MeetingRoom({ 
  roomCode = 'DEMO-123', 
  meetingId = 'demo-meeting',
  isHost = false 
}: MeetingRoomProps) {
  const navigate = useNavigate()
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [isWebRTCReady, setIsWebRTCReady] = useState(false)

  const handleLeave = () => {
    setShowLeaveDialog(true)
  }

  const confirmLeave = () => {
    setShowLeaveDialog(false)
    navigate({ to: '/meetings' })
    toast.success('Left meeting successfully')
  }

  const cancelLeave = () => {
    setShowLeaveDialog(false)
  }

  useEffect(() => {
    // Check if WebRTC is supported
    if (typeof window !== 'undefined' && 
        window.RTCPeerConnection && 
        navigator.mediaDevices && 
        navigator.mediaDevices.getUserMedia) {
      setIsWebRTCReady(true)
    } else {
      toast.error('WebRTC is not supported in this browser')
    }
  }, [])

  if (!isWebRTCReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              WebRTC Not Supported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Your browser does not support WebRTC, which is required for video conferencing.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Please use a modern browser like Chrome, Firefox, Safari, or Edge.
            </p>
            <Button onClick={() => navigate({ to: '/meetings' })}>
              Return to Meetings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <WebRTCIntegration
        roomCode={roomCode}
        meetingId={meetingId}
        isHost={isHost}
        onLeave={handleLeave}
      />

      {/* Leave Meeting Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Meeting?</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this meeting? You will lose your connection to all participants.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelLeave}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLeave}>
              Leave Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
