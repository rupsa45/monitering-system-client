import React, { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff,
  Share,
  Settings,
  Users,
  MessageSquare,
  FileText,
  Download
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface AccessibleMeetingControlsProps {
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isScreenSharing: boolean
  isRecording: boolean
  participantsCount: number
  meetingDuration: number
  onToggleVideo: () => void
  onToggleAudio: () => void
  onToggleScreenShare: () => void
  onToggleRecording: () => void
  onShowParticipants: () => void
  onShowChat: () => void
  onShowNotes: () => void
  onShowRecording: () => void
  onLeaveMeeting: () => void
  onSwitchCamera: () => void
}

export function AccessibleMeetingControls({
  isVideoEnabled,
  isAudioEnabled,
  isScreenSharing,
  isRecording,
  participantsCount,
  meetingDuration,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onToggleRecording,
  onShowParticipants,
  onShowChat,
  onShowNotes,
  onShowRecording,
  onLeaveMeeting,
  onSwitchCamera
}: AccessibleMeetingControlsProps) {
  const { user: _user } = useAuthStore()
  const controlsRef = useRef<HTMLDivElement>(null)
  const currentFocusIndex = useRef(0)
  const controls = [
    { id: 'audio', label: 'Toggle Audio', action: onToggleAudio, icon: isAudioEnabled ? Mic : MicOff, variant: isAudioEnabled ? 'default' : 'destructive' as const },
    { id: 'video', label: 'Toggle Video', action: onToggleVideo, icon: isVideoEnabled ? Video : VideoOff, variant: isVideoEnabled ? 'default' : 'destructive' as const },
    { id: 'screen-share', label: 'Toggle Screen Share', action: onToggleScreenShare, icon: Share, variant: isScreenSharing ? 'destructive' : 'outline' as const },
    { id: 'participants', label: 'Show Participants', action: onShowParticipants, icon: Users, variant: 'outline' as const },
    { id: 'chat', label: 'Show Chat', action: onShowChat, icon: MessageSquare, variant: 'outline' as const },
    { id: 'notes', label: 'Show Notes', action: onShowNotes, icon: FileText, variant: 'outline' as const },
    { id: 'recording', label: 'Show Recording', action: onShowRecording, icon: Download, variant: 'outline' as const },
    { id: 'camera', label: 'Switch Camera', action: onSwitchCamera, icon: Settings, variant: 'outline' as const },
    { id: 'leave', label: 'Leave Meeting', action: onLeaveMeeting, icon: PhoneOff, variant: 'destructive' as const }
  ]

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!controlsRef.current) return

      const controlButtons = controlsRef.current.querySelectorAll('button[data-control]')
      const totalControls = controlButtons.length

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          currentFocusIndex.current = (currentFocusIndex.current - 1 + totalControls) % totalControls
          ;(controlButtons[currentFocusIndex.current] as HTMLElement)?.focus()
          break
        case 'ArrowRight':
          event.preventDefault()
          currentFocusIndex.current = (currentFocusIndex.current + 1) % totalControls
          ;(controlButtons[currentFocusIndex.current] as HTMLElement)?.focus()
          break
        case 'ArrowUp':
          event.preventDefault()
          currentFocusIndex.current = (currentFocusIndex.current - 3 + totalControls) % totalControls
          ;(controlButtons[currentFocusIndex.current] as HTMLElement)?.focus()
          break
        case 'ArrowDown':
          event.preventDefault()
          currentFocusIndex.current = (currentFocusIndex.current + 3) % totalControls
          ;(controlButtons[currentFocusIndex.current] as HTMLElement)?.focus()
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          const focusedButton = controlButtons[currentFocusIndex.current] as HTMLElement
          focusedButton?.click()
          break
        case 'Escape':
          event.preventDefault()
          onLeaveMeeting()
          break
        case 'KeyM': {
          event.preventDefault()
          onToggleAudio()
          break
        }
        case 'KeyV': {
          event.preventDefault()
          onToggleVideo()
          break
        }
        case 'KeyS': {
          event.preventDefault()
          onToggleScreenShare()
          break
        }
        case 'KeyP': {
          event.preventDefault()
          onShowParticipants()
          break
        }
        case 'KeyC': {
          event.preventDefault()
          onShowChat()
          break
        }
        case 'KeyN': {
          event.preventDefault()
          onShowNotes()
          break
        }
        case 'KeyR': {
          event.preventDefault()
          onToggleRecording()
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onToggleAudio, onToggleVideo, onToggleScreenShare, onShowParticipants, onShowChat, onShowNotes, onToggleRecording, onLeaveMeeting])

  return (
    <div className="bg-gray-800 p-4">
      {/* Meeting Info */}
      <div className="flex items-center justify-between mb-4 text-white">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold" id="meeting-title">
              Meeting in Progress
            </h2>
            <p className="text-sm text-gray-300" id="meeting-duration">
              Duration: {formatDuration(meetingDuration)}
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-600" aria-label={`${participantsCount} participants`}>
            {participantsCount} participants
          </Badge>
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse" aria-label="Recording in progress">
              🔴 Recording
            </Badge>
          )}
        </div>
        
        {/* Keyboard Shortcuts Help */}
        <div className="text-xs text-gray-400">
          <p>Keyboard shortcuts: M (mute), V (video), S (screen share), P (participants), C (chat), N (notes), R (recording), Esc (leave)</p>
        </div>
      </div>

      {/* Controls */}
      <div 
        ref={controlsRef}
        className="flex items-center justify-center space-x-4"
        role="toolbar"
        aria-label="Meeting controls"
        aria-describedby="meeting-title meeting-duration"
      >
        {controls.map((control, index) => (
          <Button
            key={control.id}
            data-control={control.id}
            variant={control.variant}
            size="lg"
            onClick={control.action}
            className="rounded-full w-12 h-12 p-0"
            aria-label={control.label}
            aria-pressed={control.id === 'audio' ? !isAudioEnabled : 
                         control.id === 'video' ? !isVideoEnabled :
                         control.id === 'screen-share' ? isScreenSharing : undefined}
            tabIndex={index === 0 ? 0 : -1}
            onFocus={() => currentFocusIndex.current = index}
          >
            <control.icon className="h-5 w-5" aria-hidden="true" />
          </Button>
        ))}
      </div>

      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isAudioEnabled ? 'Audio enabled' : 'Audio disabled'}
        {isVideoEnabled ? 'Video enabled' : 'Video disabled'}
        {isScreenSharing ? 'Screen sharing active' : 'Screen sharing inactive'}
        {isRecording ? 'Recording started' : 'Recording stopped'}
      </div>

      {/* Focus Management Instructions */}
      <div className="sr-only">
        <p>Use arrow keys to navigate between controls. Press Enter or Space to activate. Press Escape to leave meeting.</p>
        <p>Keyboard shortcuts: M for mute/unmute, V for video on/off, S for screen share, P for participants, C for chat, N for notes, R for recording.</p>
      </div>
    </div>
  )
}
