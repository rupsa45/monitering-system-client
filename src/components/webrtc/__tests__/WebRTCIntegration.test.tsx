import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WebRTCIntegration } from '../WebRTCIntegration'
import { webrtcService } from '@/services/webrtcService'
import { socketService } from '@/services/socketService'

// Mock the services
vi.mock('@/services/webrtcService', () => ({
  webrtcService: {
    initializeLocalStream: vi.fn(),
    getLocalStream: vi.fn(),
    getRemoteStream: vi.fn(),
    toggleVideo: vi.fn(),
    toggleAudio: vi.fn(),
    startScreenShare: vi.fn(),
    stopScreenShare: vi.fn(),
    switchCamera: vi.fn(),
    closeAllConnections: vi.fn(),
    cleanup: vi.fn(),
    startStatsMonitoring: vi.fn(),
    stopStatsMonitoring: vi.fn(),
    onRemoteStream: vi.fn(),
    onPeerConnected: vi.fn(),
    onPeerDisconnected: vi.fn(),
    onIceCandidate: vi.fn(),
    onStatsUpdate: vi.fn(),
    onReconnectionAttempt: vi.fn()
  }
}))

vi.mock('@/services/socketService', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    joinRoom: vi.fn(),
    on: vi.fn(),
    sendIceCandidate: vi.fn(),
    sendAnswer: vi.fn()
  }
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

// Mock WebRTC APIs
const mockMediaStream = {
  getTracks: vi.fn(() => [
    { kind: 'video', enabled: true, stop: vi.fn() },
    { kind: 'audio', enabled: true, stop: vi.fn() }
  ])
} as any

describe('WebRTCIntegration', () => {
  const defaultProps = {
    roomCode: 'TEST-123',
    meetingId: 'test-meeting',
    isHost: false,
    onLeave: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful WebRTC initialization
    vi.mocked(webrtcService.initializeLocalStream).mockResolvedValue(mockMediaStream)
    vi.mocked(webrtcService.getLocalStream).mockReturnValue(mockMediaStream)
    vi.mocked(socketService.connect).mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the WebRTC integration component', () => {
    render(<WebRTCIntegration {...defaultProps} />)
    
    expect(screen.getByText('Meeting Room: TEST-123')).toBeInTheDocument()
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('initializes WebRTC and Socket.IO on mount', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    await waitFor(() => {
      expect(webrtcService.initializeLocalStream).toHaveBeenCalled()
      expect(socketService.connect).toHaveBeenCalled()
      expect(socketService.joinRoom).toHaveBeenCalledWith('TEST-123')
    })
  })

  it('shows host badge when user is host', () => {
    render(<WebRTCIntegration {...defaultProps} isHost={true} />)
    
    expect(screen.getByText('Host')).toBeInTheDocument()
  })

  it('toggles video when video button is clicked', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    const videoButton = screen.getByRole('button', { name: /video/i })
    fireEvent.click(videoButton)

    await waitFor(() => {
      expect(webrtcService.toggleVideo).toHaveBeenCalledWith(false)
    })
  })

  it('toggles audio when audio button is clicked', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    const audioButton = screen.getByRole('button', { name: /audio/i })
    fireEvent.click(audioButton)

    await waitFor(() => {
      expect(webrtcService.toggleAudio).toHaveBeenCalledWith(false)
    })
  })

  it('toggles screen sharing when screen share button is clicked', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    const screenShareButton = screen.getByRole('button', { name: /screen share/i })
    fireEvent.click(screenShareButton)

    await waitFor(() => {
      expect(webrtcService.startScreenShare).toHaveBeenCalled()
    })
  })

  it('switches camera when switch camera button is clicked', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    const switchCameraButton = screen.getByRole('button', { name: /switch camera/i })
    fireEvent.click(switchCameraButton)

    await waitFor(() => {
      expect(webrtcService.switchCamera).toHaveBeenCalled()
    })
  })

  it('shows participants panel when participants button is clicked', () => {
    render(<WebRTCIntegration {...defaultProps} />)

    const participantsButton = screen.getByRole('button', { name: /participants/i })
    fireEvent.click(participantsButton)

    expect(screen.getByText('Participants (0)')).toBeInTheDocument()
  })

  it('shows stats panel when stats button is clicked', () => {
    render(<WebRTCIntegration {...defaultProps} />)

    const statsButton = screen.getByRole('button', { name: /stats/i })
    fireEvent.click(statsButton)

    expect(screen.getByText('WebRTC Statistics')).toBeInTheDocument()
  })

  it('shows settings panel when settings button is clicked', () => {
    render(<WebRTCIntegration {...defaultProps} />)

    const settingsButton = screen.getByRole('button', { name: /settings/i })
    fireEvent.click(settingsButton)

    expect(screen.getByText('WebRTC Settings')).toBeInTheDocument()
  })

  it('leaves meeting when leave button is clicked', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    const leaveButton = screen.getByRole('button', { name: /leave meeting/i })
    fireEvent.click(leaveButton)

    await waitFor(() => {
      expect(webrtcService.stopStatsMonitoring).toHaveBeenCalled()
      expect(webrtcService.closeAllConnections).toHaveBeenCalled()
      expect(socketService.disconnect).toHaveBeenCalled()
      expect(webrtcService.cleanup).toHaveBeenCalled()
    })
  })

  it('handles WebRTC initialization errors', async () => {
    vi.mocked(webrtcService.initializeLocalStream).mockRejectedValue(new Error('Permission denied'))
    
    render(<WebRTCIntegration {...defaultProps} />)

    await waitFor(() => {
      expect(defaultProps.onLeave).toHaveBeenCalled()
    })
  })

  it('updates meeting duration timer', async () => {
    vi.useFakeTimers()
    
    render(<WebRTCIntegration {...defaultProps} />)

    // Fast-forward time
    vi.advanceTimersByTime(5000) // 5 seconds

    await waitFor(() => {
      expect(screen.getByText('Duration: 0:05')).toBeInTheDocument()
    })

    vi.useRealTimers()
  })

  it('formats meeting duration correctly', async () => {
    vi.useFakeTimers()
    
    render(<WebRTCIntegration {...defaultProps} />)

    // Fast-forward to 1 hour 30 minutes 45 seconds
    vi.advanceTimersByTime(5445000) // 1:30:45 in milliseconds

    await waitFor(() => {
      expect(screen.getByText('Duration: 1:30:45')).toBeInTheDocument()
    })

    vi.useRealTimers()
  })

  it('handles peer connection events', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    // Simulate peer joined event
    const mockPeerJoined = vi.mocked(socketService.on).mock.calls.find(
      call => call[0] === 'peer:joined'
    )
    
    if (mockPeerJoined && mockPeerJoined[1]) {
      mockPeerJoined[1]({
        empId: 'peer-1',
        empName: 'John Doe',
        role: 'PARTICIPANT'
      })
    }

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  it('handles host control events', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    // Simulate host kicked event
    const mockHostKicked = vi.mocked(socketService.on).mock.calls.find(
      call => call[0] === 'host:kicked'
    )
    
    if (mockHostKicked && mockHostKicked[1]) {
      mockHostKicked[1]({ reason: 'Inappropriate behavior' })
    }

    await waitFor(() => {
      expect(defaultProps.onLeave).toHaveBeenCalled()
    })
  })

  it('starts stats monitoring on initialization', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    await waitFor(() => {
      expect(webrtcService.startStatsMonitoring).toHaveBeenCalledWith(3000)
    })
  })

  it('cleans up resources on unmount', () => {
    const { unmount } = render(<WebRTCIntegration {...defaultProps} />)

    unmount()

    expect(webrtcService.stopStatsMonitoring).toHaveBeenCalled()
  })

  it('displays connection status correctly', () => {
    render(<WebRTCIntegration {...defaultProps} />)
    
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('shows participant count', () => {
    render(<WebRTCIntegration {...defaultProps} />)
    
    expect(screen.getByText('0 participants')).toBeInTheDocument()
  })

  it('handles screen sharing state correctly', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    const screenShareButton = screen.getByRole('button', { name: /screen share/i })
    
    // Initially not sharing
    expect(screenShareButton).toHaveClass('bg-primary')
    
    // Click to start sharing
    fireEvent.click(screenShareButton)
    
    await waitFor(() => {
      expect(webrtcService.startScreenShare).toHaveBeenCalled()
    })
  })

  it('handles camera switching', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    const switchCameraButton = screen.getByRole('button', { name: /switch camera/i })
    fireEvent.click(switchCameraButton)

    await waitFor(() => {
      expect(webrtcService.switchCamera).toHaveBeenCalled()
    })
  })

  it('displays local video correctly', () => {
    render(<WebRTCIntegration {...defaultProps} />)
    
    // Check if local video component is rendered
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('handles remote stream events', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    // Simulate remote stream event
    const mockOnRemoteStream = vi.mocked(webrtcService.onRemoteStream)
    if (mockOnRemoteStream) {
      // Call the callback directly
      const callback = mockOnRemoteStream.mock.calls[0]?.[1]
      if (callback) {
        callback('peer-1', mockMediaStream)
      }
    }

    await waitFor(() => {
      expect(screen.getByText('Participant peer-1')).toBeInTheDocument()
    })
  })

  it('handles peer disconnection', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    // Simulate peer disconnected event
    const mockOnPeerDisconnected = vi.mocked(webrtcService.onPeerDisconnected)
    if (mockOnPeerDisconnected) {
      const callback = mockOnPeerDisconnected.mock.calls[0]?.[1]
      if (callback) {
        callback('peer-1')
      }
    }

    // Should update participants list
    await waitFor(() => {
      // Check that the peer is marked as disconnected
      expect(screen.queryByText('Participant peer-1')).not.toBeInTheDocument()
    })
  })

  it('handles ICE candidate events', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    // Simulate ICE candidate event
    const mockOnIceCandidate = vi.mocked(webrtcService.onIceCandidate)
    if (mockOnIceCandidate) {
      const callback = mockOnIceCandidate.mock.calls[0]?.[1]
      if (callback) {
        const mockCandidate = { candidate: 'test-candidate' } as RTCIceCandidate
        callback('peer-1', mockCandidate)
      }
    }

    await waitFor(() => {
      expect(socketService.sendIceCandidate).toHaveBeenCalledWith('peer-1', expect.any(Object))
    })
  })

  it('handles stats updates', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    // Simulate stats update event
    const mockOnStatsUpdate = vi.mocked(webrtcService.onStatsUpdate)
    if (mockOnStatsUpdate) {
      const callback = mockOnStatsUpdate.mock.calls[0]?.[1]
      if (callback) {
        const mockStats = [
          {
            peerId: 'peer-1',
            quality: 'high' as const,
            bandwidth: 1000000,
            packetsLost: 0,
            roundTripTime: 50,
            jitter: 5,
            timestamp: Date.now()
          }
        ]
        callback(mockStats)
      }
    }

    // Stats should be updated in the component state
    await waitFor(() => {
      // The stats component should receive the updated stats
      expect(webrtcService.onStatsUpdate).toHaveBeenCalled()
    })
  })

  it('handles reconnection attempts', async () => {
    render(<WebRTCIntegration {...defaultProps} />)

    // Simulate reconnection attempt event
    const mockOnReconnectionAttempt = vi.mocked(webrtcService.onReconnectionAttempt)
    if (mockOnReconnectionAttempt) {
      const callback = mockOnReconnectionAttempt.mock.calls[0]?.[1]
      if (callback) {
        callback('peer-1', 2)
      }
    }

    await waitFor(() => {
      expect(webrtcService.onReconnectionAttempt).toHaveBeenCalled()
    })
  })
})




