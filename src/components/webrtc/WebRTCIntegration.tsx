import React, { useEffect, useState, useRef, useCallback } from 'react'
import { webrtcService, WebRTCStats } from '@/services/webrtcService'
import { socketService } from '@/services/socketService'
import { WebRTCVideo } from './WebRTCVideo'
import { WebRTCConnectionStatus } from './WebRTCConnectionStatus'
import { WebRTCStats as WebRTCStatsComponent } from './WebRTCStats'
import { WebRTCSettingsPanel } from './WebRTCSettings'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { toast } from 'sonner'

interface WebRTCIntegrationProps {
  roomCode: string
  meetingId: string
  isHost: boolean
  onLeave?: () => void
  className?: string
}

export function WebRTCIntegration({
  roomCode,
  meetingId,
  isHost,
  onLeave,
  className
}: WebRTCIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [participants, setParticipants] = useState<Array<{
    empId: string
    empName: string
    role: 'HOST' | 'COHOST' | 'PARTICIPANT'
    isConnected: boolean
    isVideoEnabled: boolean
    isAudioEnabled: boolean
  }>>([])
  const [showParticipants, setShowParticipants] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showRecording, setShowRecording] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [connectionStats, setConnectionStats] = useState<WebRTCStats[]>([])
  const [meetingDuration, setMeetingDuration] = useState(0)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideosRef = useRef<HTMLDivElement>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout>()

  // Initialize WebRTC integration
  const initializeWebRTC = useCallback(async () => {
    try {
      // Initialize local media stream
      await webrtcService.initializeLocalStream()
      
      // Set up local video
      const localStream = webrtcService.getLocalStream()
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream
      }

      // Set up WebRTC event handlers
      setupWebRTCEventHandlers()

      // Connect to Socket.IO
      await socketService.connect()
      socketService.joinRoom(roomCode)

      // Set up Socket.IO event handlers
      setupSocketEventHandlers()

      setIsConnected(true)
      toast.success('Successfully joined meeting!')

      // Start meeting duration timer
      startMeetingTimer()

      // Start stats monitoring
      webrtcService.startStatsMonitoring(3000)
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error)
      toast.error('Failed to join meeting. Please check your camera and microphone permissions.')
      onLeave?.()
    }
  }, [roomCode, onLeave])

  // Set up WebRTC event handlers
  const setupWebRTCEventHandlers = useCallback(() => {
    webrtcService.onRemoteStream = (peerId, stream) => {
      // Add remote video element
      if (remoteVideosRef.current) {
        const videoElement = document.createElement('video')
        videoElement.srcObject = stream
        videoElement.autoplay = true
        videoElement.playsInline = true
        videoElement.className = 'w-full h-full object-cover rounded-lg'
        videoElement.id = `remote-${peerId}`
        
        const videoContainer = document.createElement('div')
        videoContainer.className = 'relative bg-gray-900 rounded-lg overflow-hidden'
        videoContainer.appendChild(videoElement)
        
        remoteVideosRef.current.appendChild(videoContainer)
      }

      // Update participants list
      setParticipants(prev => {
        const existing = prev.find(p => p.empId === peerId)
        if (!existing) {
          return [...prev, {
            empId: peerId,
            empName: `Participant ${peerId}`,
            role: 'PARTICIPANT',
            isConnected: true,
            isVideoEnabled: true,
            isAudioEnabled: true
          }]
        }
        return prev.map(p => p.empId === peerId ? { ...p, isConnected: true } : p)
      })
    }

    webrtcService.onPeerConnected = (peerId) => {
      console.log(`Peer ${peerId} connected`)
      setParticipants(prev => 
        prev.map(p => p.empId === peerId ? { ...p, isConnected: true } : p)
      )
    }

    webrtcService.onPeerDisconnected = (peerId) => {
      console.log(`Peer ${peerId} disconnected`)
      
      // Remove remote video element
      const videoElement = document.getElementById(`remote-${peerId}`)
      if (videoElement?.parentElement) {
        videoElement.parentElement.remove()
      }

      setParticipants(prev => 
        prev.map(p => p.empId === peerId ? { ...p, isConnected: false } : p)
      )
    }

    webrtcService.onIceCandidate = (peerId, candidate) => {
      socketService.sendIceCandidate(peerId, candidate)
    }

    webrtcService.onStatsUpdate = (stats) => {
      setConnectionStats(stats)
    }

    webrtcService.onReconnectionAttempt = (peerId, attempt) => {
      console.log(`Reconnection attempt ${attempt} for peer ${peerId}`)
      toast.info(`Attempting to reconnect to ${peerId} (${attempt}/5)`)
    }
  }, [])

  // Set up Socket.IO event handlers
  const setupSocketEventHandlers = useCallback(() => {
    socketService.on('peer:joined', (data) => {
      console.log('Peer joined:', data)
      setParticipants(prev => {
        const existing = prev.find(p => p.empId === data.empId)
        if (!existing) {
          return [...prev, {
            empId: data.empId,
            empName: data.empName,
            role: data.role,
            isConnected: true,
            isVideoEnabled: true,
            isAudioEnabled: true
          }]
        }
        return prev
      })
    })

    socketService.on('peer:left', (data) => {
      console.log('Peer left:', data)
      setParticipants(prev => 
        prev.filter(p => p.empId !== data.empId)
      )
    })

    socketService.on('signal:offer', async (data) => {
      try {
        const peerId = data.fromEmpId
        
        // Create peer connection if it doesn't exist
        if (!webrtcService.getPeerConnection(peerId)) {
          webrtcService.createPeerConnection(peerId)
        }

        // Set remote description
        await webrtcService.setRemoteDescription(peerId, data.offer)
        
        // Create and send answer
        const answer = await webrtcService.createAnswer(peerId)
        socketService.sendAnswer(peerId, answer)
      } catch (error) {
        console.error('Failed to handle offer:', error)
      }
    })

    socketService.on('signal:answer', async (data) => {
      try {
        const peerId = data.fromEmpId
        await webrtcService.setRemoteDescription(peerId, data.answer)
      } catch (error) {
        console.error('Failed to handle answer:', error)
      }
    })

    socketService.on('signal:ice', async (data) => {
      try {
        const peerId = data.fromEmpId
        await webrtcService.addIceCandidate(peerId, data.candidate)
      } catch (error) {
        console.error('Failed to handle ICE candidate:', error)
      }
    })

    socketService.on('host:kicked', (data) => {
      toast.error(`You have been kicked from the meeting: ${data.reason}`)
      onLeave?.()
    })

    socketService.on('host:banned', (data) => {
      toast.error(`You have been banned from the meeting: ${data.reason}`)
      onLeave?.()
    })

    socketService.on('host:ended', (data) => {
      toast.info(`Meeting ended by host: ${data.reason}`)
      onLeave?.()
    })
  }, [onLeave])

  // Start meeting timer
  const startMeetingTimer = useCallback(() => {
    durationIntervalRef.current = setInterval(() => {
      setMeetingDuration(prev => prev + 1)
    }, 1000)
  }, [])

  // Media controls
  const toggleVideo = useCallback(async () => {
    try {
      await webrtcService.toggleVideo(!isVideoEnabled)
      setIsVideoEnabled(!isVideoEnabled)
      toast.success(`Video ${!isVideoEnabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Failed to toggle video:', error)
      toast.error('Failed to toggle video')
    }
  }, [isVideoEnabled])

  const toggleAudio = useCallback(async () => {
    try {
      await webrtcService.toggleAudio(!isAudioEnabled)
      setIsAudioEnabled(!isAudioEnabled)
      toast.success(`Audio ${!isAudioEnabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Failed to toggle audio:', error)
      toast.error('Failed to toggle audio')
    }
  }, [isAudioEnabled])

  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        await webrtcService.stopScreenShare()
        setIsScreenSharing(false)
        toast.success('Screen sharing stopped')
      } else {
        await webrtcService.startScreenShare()
        setIsScreenSharing(true)
        toast.success('Screen sharing started')
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error)
      toast.error('Failed to toggle screen sharing')
    }
  }, [isScreenSharing])

  const switchCamera = useCallback(async () => {
    try {
      await webrtcService.switchCamera()
      toast.success('Camera switched')
    } catch (error) {
      console.error('Failed to switch camera:', error)
      toast.error('Failed to switch camera')
    }
  }, [])

  // Leave meeting
  const leaveMeeting = useCallback(async () => {
    try {
      // Stop stats monitoring
      webrtcService.stopStatsMonitoring()
      
      // Close all WebRTC connections
      await webrtcService.closeAllConnections()
      
      // Disconnect from Socket.IO
      socketService.disconnect()
      
      // Clear meeting timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
      
      // Cleanup WebRTC service
      webrtcService.cleanup()
      
      toast.success('Left meeting successfully')
      onLeave?.()
    } catch (error) {
      console.error('Failed to leave meeting:', error)
      onLeave?.()
    }
  }, [onLeave])

  // Format meeting duration
  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Initialize on mount
  useEffect(() => {
    initializeWebRTC()

    return () => {
      // Cleanup on unmount
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
      webrtcService.stopStatsMonitoring()
    }
  }, [initializeWebRTC])

  return (
    <div className={`flex h-screen bg-gray-900 ${className}`}>
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-white font-semibold">Meeting Room: {roomCode}</h2>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            <span className="text-gray-300 text-sm">
              Duration: {formatDuration(meetingDuration)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-gray-300 text-sm">
              {participants.filter(p => p.isConnected).length} participants
            </span>
            {isHost && (
              <Badge variant="secondary">Host</Badge>
            )}
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {/* Local Video */}
            <div className="relative">
              <WebRTCVideo
                stream={webrtcService.getLocalStream()}
                isLocal={true}
                isAudioEnabled={isAudioEnabled}
                isVideoEnabled={isVideoEnabled}
                peerName="You"
                className="h-full"
              />
            </div>

            {/* Remote Videos */}
            <div ref={remoteVideosRef} className="space-y-4">
              {participants.filter(p => p.isConnected).map(participant => (
                <div key={participant.empId} className="relative">
                  <WebRTCVideo
                    stream={webrtcService.getRemoteStream(participant.empId)}
                    isLocal={false}
                    isAudioEnabled={participant.isAudioEnabled}
                    isVideoEnabled={participant.isVideoEnabled}
                    peerName={participant.empName}
                    className="h-full"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {participant.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
          <Button
            variant={isVideoEnabled ? 'default' : 'destructive'}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full w-12 h-12"
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={isAudioEnabled ? 'default' : 'destructive'}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full w-12 h-12"
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={isScreenSharing ? 'destructive' : 'default'}
            size="lg"
            onClick={toggleScreenShare}
            className="rounded-full w-12 h-12"
          >
            {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={switchCamera}
            className="rounded-full w-12 h-12"
          >
            <Video className="h-5 w-5" />
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <Users className="h-4 w-4 mr-2" />
              Participants
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Notes
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecording(!showRecording)}
            >
              <Download className="h-4 w-4 mr-2" />
              Recording
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Stats
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>

          <Button
            variant="destructive"
            size="lg"
            onClick={leaveMeeting}
            className="rounded-full w-12 h-12"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      {(showParticipants || showChat || showNotes || showRecording || showStats) && (
        <div className="w-80 bg-gray-800 border-l border-gray-700">
          {showParticipants && (
            <Card className="h-full rounded-none border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {participants.map(participant => (
                  <div key={participant.empId} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${participant.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm">{participant.empName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {participant.role}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      {participant.isVideoEnabled && <Video className="h-3 w-3 text-green-500" />}
                      {participant.isAudioEnabled && <Mic className="h-3 w-3 text-green-500" />}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {showChat && (
            <div className="h-full p-4">
              <h3 className="text-white font-semibold mb-4">Chat</h3>
              <p className="text-gray-400 text-sm">Chat functionality coming soon...</p>
            </div>
          )}

          {showNotes && (
            <div className="h-full p-4">
              <h3 className="text-white font-semibold mb-4">Meeting Notes</h3>
              <p className="text-gray-400 text-sm">Notes functionality coming soon...</p>
            </div>
          )}

          {showRecording && (
            <div className="h-full p-4">
              <h3 className="text-white font-semibold mb-4">Recording</h3>
              <p className="text-gray-400 text-sm">Recording functionality coming soon...</p>
            </div>
          )}

          {showStats && (
            <WebRTCStatsComponent className="h-full" />
          )}
        </div>
      )}

      {/* WebRTC Settings Panel */}
      <WebRTCSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}




