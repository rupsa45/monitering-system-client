import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, Mic, MicOff, Video, VideoOff } from 'lucide-react'

interface WebRTCVideoProps {
  stream: MediaStream | null
  isLocal?: boolean
  isAudioEnabled?: boolean
  isVideoEnabled?: boolean
  peerName?: string
  className?: string
  onError?: (error: Error) => void
}

export function WebRTCVideo({
  stream,
  isLocal = false,
  isAudioEnabled = true,
  isVideoEnabled = true,
  peerName,
  className,
  onError
}: WebRTCVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setIsLoading(false)
      setHasError(false)
    }

    const handleError = (event: Event) => {
      const error = new Error('Failed to load video stream')
      setHasError(true)
      setIsLoading(false)
      onError?.(error)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('error', handleError)
    video.addEventListener('canplay', handleCanPlay)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('error', handleError)
      video.removeEventListener('canplay', handleCanPlay)
    }
  }, [onError])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return

    video.srcObject = stream
    video.muted = isLocal // Always mute local video to prevent feedback
  }, [stream, isLocal])

  if (!stream) {
    return (
      <div className={cn(
        'relative bg-gray-900 rounded-lg flex items-center justify-center',
        'min-h-[200px] w-full',
        className
      )}>
        <div className="text-center text-gray-400">
          <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No video stream</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'relative bg-gray-900 rounded-lg overflow-hidden',
      'min-h-[200px] w-full',
      className
    )}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
        aria-label={isLocal ? 'Your video' : `${peerName}'s video`}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-red-400">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Video unavailable</p>
          </div>
        </div>
      )}

      {/* Video Disabled Overlay */}
      {!isVideoEnabled && !hasError && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <VideoOff className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Camera off</p>
          </div>
        </div>
      )}

      {/* Audio Status Indicator */}
      <div className="absolute top-2 left-2">
        {isAudioEnabled ? (
          <div className="bg-green-500 text-white p-1 rounded-full">
            <Mic className="h-3 w-3" />
          </div>
        ) : (
          <div className="bg-red-500 text-white p-1 rounded-full">
            <MicOff className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Peer Name */}
      {peerName && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {peerName}
        </div>
      )}

      {/* Local Indicator */}
      {isLocal && (
        <div className="absolute bottom-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-sm">
          You
        </div>
      )}
    </div>
  )
}





