import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Record, 
  Square, 
  Download, 
  Trash2, 
  Clock,
  FileVideo,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { socketService } from '@/services/socketService'
import { toast } from 'sonner'

interface Recording {
  id: string
  meetingId: string
  fileName: string
  fileSize: number
  duration: number
  createdAt: Date
  status: 'recording' | 'processing' | 'completed' | 'failed'
  downloadUrl?: string
}

interface MeetingRecordingProps {
  meetingId: string
  roomCode: string
  isOpen: boolean
  onClose: () => void
}

export function MeetingRecording({ meetingId, roomCode, isOpen, onClose }: MeetingRecordingProps) {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null)
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null)
  const { user: _user } = useAuthStore()

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      setRecordingInterval(interval)
    } else {
      if (recordingInterval) {
        clearInterval(recordingInterval)
        setRecordingInterval(null)
      }
    }

    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval)
      }
    }
  }, [isRecording])

  // Socket.IO event listeners
  useEffect(() => {
    if (!isOpen) return

    // Listen for recording start
    socketService.on('recording:started', (data: { recordingId: string; meetingId: string }) => {
      if (data.meetingId === meetingId) {
        setIsRecording(true)
        setCurrentRecordingId(data.recordingId)
        setRecordingTime(0)
        
        const newRecording: Recording = {
          id: data.recordingId,
          meetingId: data.meetingId,
          fileName: `recording-${new Date().toISOString().split('T')[0]}-${Date.now()}.webm`,
          fileSize: 0,
          duration: 0,
          createdAt: new Date(),
          status: 'recording'
        }
        
        setRecordings(prev => [...prev, newRecording])
        toast.success('Recording started!')
      }
    })

    // Listen for recording stop
    socketService.on('recording:stopped', (data: { recordingId: string; meetingId: string }) => {
      if (data.meetingId === meetingId) {
        setIsRecording(false)
        setCurrentRecordingId(null)
        setRecordingTime(0)
        
        setRecordings(prev => prev.map(recording => 
          recording.id === data.recordingId 
            ? { ...recording, status: 'processing' }
            : recording
        ))
        
        toast.success('Recording stopped! Processing...')
      }
    })

    // Listen for recording completed
    socketService.on('recording:completed', (data: Recording) => {
      if (data.meetingId === meetingId) {
        setRecordings(prev => prev.map(recording => 
          recording.id === data.id 
            ? { ...data, status: 'completed' }
            : recording
        ))
        
        toast.success('Recording completed and ready for download!')
      }
    })

    // Listen for recording failed
    socketService.on('recording:failed', (data: { recordingId: string; meetingId: string; error: string }) => {
      if (data.meetingId === meetingId) {
        setRecordings(prev => prev.map(recording => 
          recording.id === data.recordingId 
            ? { ...recording, status: 'failed' }
            : recording
        ))
        
        toast.error(`Recording failed: ${data.error}`)
      }
    })

    return () => {
      socketService.off('recording:started')
      socketService.off('recording:stopped')
      socketService.off('recording:completed')
      socketService.off('recording:failed')
    }
  }, [isOpen, meetingId])

  const handleStartRecording = async () => {
    try {
      // Emit start recording to server
      socketService.emit('recording:start', {
        meetingId,
        roomCode,
        quality: 'high', // Can be configurable
        includeAudio: true,
        includeVideo: true
      })
    } catch (error) {
      toast.error('Failed to start recording')
    }
  }

  const handleStopRecording = async () => {
    if (!currentRecordingId) return

    try {
      // Emit stop recording to server
      socketService.emit('recording:stop', {
        meetingId,
        roomCode,
        recordingId: currentRecordingId
      })
    } catch (error) {
      toast.error('Failed to stop recording')
    }
  }

  const handleDownloadRecording = async (recording: Recording) => {
    if (!recording.downloadUrl) {
      toast.error('Download URL not available')
      return
    }

    try {
      const response = await fetch(recording.downloadUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = recording.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Recording downloaded successfully!')
    } catch (error) {
      toast.error('Failed to download recording')
    }
  }

  const handleDeleteRecording = async (recordingId: string) => {
    try {
      // Emit delete recording to server
      socketService.emit('recording:delete', {
        meetingId,
        roomCode,
        recordingId
      })
      
      // Remove from local state
      setRecordings(prev => prev.filter(recording => recording.id !== recordingId))
      toast.success('Recording deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete recording')
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusBadge = (status: Recording['status']) => {
    switch (status) {
      case 'recording':
        return <Badge variant="destructive" className="animate-pulse">Recording</Badge>
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>
      case 'completed':
        return <Badge variant="default">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <Card className="w-80 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Meeting Recording</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Recording Controls */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isRecording ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStopRecording}
                  className="animate-pulse"
                >
                  <Square className="w-4 h-4 mr-1" />
                  Stop Recording
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartRecording}
                  disabled={isRecording}
                >
                  <Record className="w-4 h-4 mr-1" />
                  Start Recording
                </Button>
              )}
            </div>
            
            {isRecording && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatDuration(recordingTime)}</span>
              </div>
            )}
          </div>
          
          {isRecording && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Recording in progress...</span>
                <span>{formatDuration(recordingTime)}</span>
              </div>
              <Progress value={(recordingTime % 60) / 60 * 100} className="h-1" />
            </div>
          )}
        </div>
        
        {/* Recordings List */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-3">
            {recordings.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileVideo className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recordings yet</p>
                <p className="text-sm">Start recording to capture this meeting</p>
              </div>
            ) : (
              recordings.map((recording) => (
                <div key={recording.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileVideo className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">
                        {recording.fileName}
                      </span>
                    </div>
                    {getStatusBadge(recording.status)}
                  </div>
                  
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Duration: {formatDuration(recording.duration)}</span>
                      {recording.fileSize > 0 && (
                        <span>Size: {formatFileSize(recording.fileSize)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Created: {recording.createdAt.toLocaleDateString()}</span>
                      <span>{recording.createdAt.toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    {recording.status === 'completed' && recording.downloadUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadRecording(recording)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    )}
                    
                    {recording.status === 'failed' && (
                      <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="w-3 h-3" />
                        <span>Recording failed</span>
                      </div>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRecording(recording.id)}
                      className="ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
