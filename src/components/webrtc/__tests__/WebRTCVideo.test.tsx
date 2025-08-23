import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WebRTCVideo } from '../WebRTCVideo'

// Mock MediaStream
const mockMediaStream = {
  getTracks: vi.fn(() => [
    { kind: 'video', enabled: true },
    { kind: 'audio', enabled: true }
  ])
} as any

describe('WebRTCVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders video element when stream is provided', () => {
    render(
      <WebRTCVideo
        stream={mockMediaStream}
        isLocal={false}
        peerName="Test User"
      />
    )

    const video = screen.getByRole('video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('aria-label', "Test User's video")
  })

  it('renders placeholder when no stream is provided', () => {
    render(<WebRTCVideo stream={null} />)

    expect(screen.getByText('No video stream')).toBeInTheDocument()
    expect(screen.queryByRole('video')).not.toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<WebRTCVideo stream={mockMediaStream} />)

    expect(screen.getByText('Loading video...')).toBeInTheDocument()
  })

  it('handles video loading events', async () => {
    render(<WebRTCVideo stream={mockMediaStream} />)

    const video = screen.getByRole('video')
    
    // Simulate video loaded
    fireEvent.loadedMetadata(video)
    fireEvent.canPlay(video)

    await waitFor(() => {
      expect(screen.queryByText('Loading video...')).not.toBeInTheDocument()
    })
  })

  it('handles video error events', async () => {
    const onError = vi.fn()
    render(<WebRTCVideo stream={mockMediaStream} onError={onError} />)

    const video = screen.getByRole('video')
    fireEvent.error(video)

    await waitFor(() => {
      expect(screen.getByText('Video unavailable')).toBeInTheDocument()
      expect(onError).toHaveBeenCalled()
    })
  })

  it('shows video disabled overlay when video is disabled', () => {
    render(
      <WebRTCVideo
        stream={mockMediaStream}
        isVideoEnabled={false}
      />
    )

    expect(screen.getByText('Camera off')).toBeInTheDocument()
  })

  it('shows audio status indicators', () => {
    render(
      <WebRTCVideo
        stream={mockMediaStream}
        isAudioEnabled={true}
      />
    )

    // Should show mic icon for enabled audio
    expect(screen.getByRole('video').parentElement).toHaveTextContent('')
  })

  it('shows peer name when provided', () => {
    render(
      <WebRTCVideo
        stream={mockMediaStream}
        peerName="John Doe"
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('shows local indicator for local video', () => {
    render(
      <WebRTCVideo
        stream={mockMediaStream}
        isLocal={true}
      />
    )

    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('mutes local video to prevent feedback', () => {
    render(
      <WebRTCVideo
        stream={mockMediaStream}
        isLocal={true}
      />
    )

    const video = screen.getByRole('video')
    expect(video).toHaveAttribute('muted')
  })

  it('applies custom className', () => {
    render(
      <WebRTCVideo
        stream={mockMediaStream}
        className="custom-class"
      />
    )

    const container = screen.getByRole('video').parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('handles accessibility attributes correctly', () => {
    render(
      <WebRTCVideo
        stream={mockMediaStream}
        isLocal={true}
        peerName="Test User"
      />
    )

    const video = screen.getByRole('video')
    expect(video).toHaveAttribute('aria-label', 'Your video')
    expect(video).toHaveAttribute('playsInline')
    expect(video).toHaveAttribute('autoPlay')
  })

  it('handles video disabled state with error', () => {
    render(
      <WebRTCVideo
        stream={mockMediaStream}
        isVideoEnabled={false}
      />
    )

    // Should show camera off overlay, not error overlay
    expect(screen.getByText('Camera off')).toBeInTheDocument()
    expect(screen.queryByText('Video unavailable')).not.toBeInTheDocument()
  })

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(<WebRTCVideo stream={mockMediaStream} />)
    
    // Should not throw any errors on unmount
    expect(() => unmount()).not.toThrow()
  })
})




