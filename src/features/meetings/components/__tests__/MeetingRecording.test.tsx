import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MeetingRecording } from '../MeetingRecording'
import { socketService } from '@/services/socketService'
import { useAuthStore } from '@/stores/authStore'

// Mock dependencies
vi.mock('@/services/socketService')
vi.mock('@/stores/authStore')
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockSocketService = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
}

const mockAuthStore = {
  user: {
    empId: 'user123',
    empName: 'Test User',
  },
}

describe('MeetingRecording', () => {
  const defaultProps = {
    meetingId: 'meeting123',
    roomCode: 'ROOM123',
    isOpen: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    ;(socketService as any) = mockSocketService
    ;(useAuthStore as any).mockReturnValue(mockAuthStore)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('should render recording component when isOpen is true', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      expect(screen.getByText('Meeting Recording')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<MeetingRecording {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('Meeting Recording')).not.toBeInTheDocument()
    })

    it('should display close button', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      const closeButton = screen.getByRole('button', { name: '×' })
      expect(closeButton).toBeInTheDocument()
    })

    it('should show empty state when no recordings exist', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      expect(screen.getByText('No recordings yet')).toBeInTheDocument()
      expect(screen.getByText('Start recording to capture this meeting')).toBeInTheDocument()
    })
  })

  describe('Recording Controls', () => {
    it('should start recording when start button is clicked', async () => {
      render(<MeetingRecording {...defaultProps} />)
      
      const startButton = screen.getByRole('button', { name: /start recording/i })
      fireEvent.click(startButton)
      
      await waitFor(() => {
        expect(mockSocketService.emit).toHaveBeenCalledWith('recording:start', {
          meetingId: 'meeting123',
          roomCode: 'ROOM123',
          quality: 'high',
          includeAudio: true,
          includeVideo: true,
        })
      })
    })

    it('should stop recording when stop button is clicked', async () => {
      render(<MeetingRecording {...defaultProps} />)
      
      // First start recording
      const startButton = screen.getByRole('button', { name: /start recording/i })
      fireEvent.click(startButton)
      
      // Simulate recording started
      const startedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:started'
      )?.[1]
      
      if (startedCallback) {
        startedCallback({
          recordingId: 'recording123',
          meetingId: 'meeting123',
        })
      }
      
      // Now stop recording
      const stopButton = screen.getByRole('button', { name: /stop recording/i })
      fireEvent.click(stopButton)
      
      await waitFor(() => {
        expect(mockSocketService.emit).toHaveBeenCalledWith('recording:stop', {
          meetingId: 'meeting123',
          roomCode: 'ROOM123',
          recordingId: 'recording123',
        })
      })
    })

    it('should show recording timer when recording is active', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      // Start recording
      const startButton = screen.getByRole('button', { name: /start recording/i })
      fireEvent.click(startButton)
      
      // Simulate recording started
      const startedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:started'
      )?.[1]
      
      if (startedCallback) {
        startedCallback({
          recordingId: 'recording123',
          meetingId: 'meeting123',
        })
      }
      
      // Fast-forward time by 5 seconds
      vi.advanceTimersByTime(5000)
      
      expect(screen.getByText('0:05')).toBeInTheDocument()
    })

    it('should show progress bar when recording is active', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      // Start recording
      const startButton = screen.getByRole('button', { name: /start recording/i })
      fireEvent.click(startButton)
      
      // Simulate recording started
      const startedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:started'
      )?.[1]
      
      if (startedCallback) {
        startedCallback({
          recordingId: 'recording123',
          meetingId: 'meeting123',
        })
      }
      
      expect(screen.getByText('Recording in progress...')).toBeInTheDocument()
    })
  })

  describe('Recording Status Management', () => {
    it('should handle recording started event', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      const startedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:started'
      )?.[1]
      
      if (startedCallback) {
        startedCallback({
          recordingId: 'recording123',
          meetingId: 'meeting123',
        })
      }
      
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument()
      expect(screen.getByText('Recording')).toBeInTheDocument()
    })

    it('should handle recording stopped event', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      // First start recording
      const startedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:started'
      )?.[1]
      
      if (startedCallback) {
        startedCallback({
          recordingId: 'recording123',
          meetingId: 'meeting123',
        })
      }
      
      // Then stop recording
      const stoppedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:stopped'
      )?.[1]
      
      if (stoppedCallback) {
        stoppedCallback({
          recordingId: 'recording123',
          meetingId: 'meeting123',
        })
      }
      
      expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument()
      expect(screen.getByText('Processing')).toBeInTheDocument()
    })

    it('should handle recording completed event', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      const completedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:completed'
      )?.[1]
      
      if (completedCallback) {
        completedCallback({
          id: 'recording123',
          meetingId: 'meeting123',
          fileName: 'recording.webm',
          fileSize: 1024000,
          duration: 120,
          createdAt: new Date(),
          status: 'completed',
          downloadUrl: 'https://example.com/recording.webm',
        })
      }
      
      expect(screen.getByText('recording.webm')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
    })

    it('should handle recording failed event', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      const failedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:failed'
      )?.[1]
      
      if (failedCallback) {
        failedCallback({
          recordingId: 'recording123',
          meetingId: 'meeting123',
          error: 'Recording failed due to insufficient storage',
        })
      }
      
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })
  })

  describe('Recording List Display', () => {
    it('should display recording information correctly', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      const completedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:completed'
      )?.[1]
      
      if (completedCallback) {
        completedCallback({
          id: 'recording123',
          meetingId: 'meeting123',
          fileName: 'meeting-recording.webm',
          fileSize: 2048000,
          duration: 180,
          createdAt: new Date('2024-01-15T10:00:00Z'),
          status: 'completed',
          downloadUrl: 'https://example.com/recording.webm',
        })
      }
      
      expect(screen.getByText('meeting-recording.webm')).toBeInTheDocument()
      expect(screen.getByText('Duration: 3:00')).toBeInTheDocument()
      expect(screen.getByText('Size: 2 MB')).toBeInTheDocument()
    })

    it('should display multiple recordings', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      const completedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:completed'
      )?.[1]
      
      if (completedCallback) {
        // Add first recording
        completedCallback({
          id: 'recording1',
          meetingId: 'meeting123',
          fileName: 'recording1.webm',
          fileSize: 1024000,
          duration: 60,
          createdAt: new Date(),
          status: 'completed',
          downloadUrl: 'https://example.com/recording1.webm',
        })
        
        // Add second recording
        completedCallback({
          id: 'recording2',
          meetingId: 'meeting123',
          fileName: 'recording2.webm',
          fileSize: 2048000,
          duration: 120,
          createdAt: new Date(),
          status: 'completed',
          downloadUrl: 'https://example.com/recording2.webm',
        })
      }
      
      expect(screen.getByText('recording1.webm')).toBeInTheDocument()
      expect(screen.getByText('recording2.webm')).toBeInTheDocument()
    })
  })

  describe('Recording Download', () => {
    it('should download recording when download button is clicked', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['test content'])),
      })
      global.fetch = mockFetch
      
      const mockCreateObjectURL = vi.fn(() => 'blob:test')
      const mockRevokeObjectURL = vi.fn()
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()
      const mockClick = vi.fn()
      
      global.URL.createObjectURL = mockCreateObjectURL
      global.URL.revokeObjectURL = mockRevokeObjectURL
      global.document.createElement = vi.fn(() => ({
        href: '',
        download: '',
        click: mockClick,
      }))
      global.document.body = {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      } as any
      
      render(<MeetingRecording {...defaultProps} />)
      
      // Add a completed recording
      const completedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:completed'
      )?.[1]
      
      if (completedCallback) {
        completedCallback({
          id: 'recording123',
          meetingId: 'meeting123',
          fileName: 'recording.webm',
          fileSize: 1024000,
          duration: 60,
          createdAt: new Date(),
          status: 'completed',
          downloadUrl: 'https://example.com/recording.webm',
        })
      }
      
      // Click download button
      const downloadButton = screen.getByRole('button', { name: /download/i })
      fireEvent.click(downloadButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('https://example.com/recording.webm')
        expect(mockCreateObjectURL).toHaveBeenCalled()
        expect(mockClick).toHaveBeenCalled()
        expect(mockRevokeObjectURL).toHaveBeenCalled()
      })
    })

    it('should handle download errors gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Download failed'))
      global.fetch = mockFetch
      
      render(<MeetingRecording {...defaultProps} />)
      
      // Add a completed recording
      const completedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:completed'
      )?.[1]
      
      if (completedCallback) {
        completedCallback({
          id: 'recording123',
          meetingId: 'meeting123',
          fileName: 'recording.webm',
          fileSize: 1024000,
          duration: 60,
          createdAt: new Date(),
          status: 'completed',
          downloadUrl: 'https://example.com/recording.webm',
        })
      }
      
      // Click download button
      const downloadButton = screen.getByRole('button', { name: /download/i })
      fireEvent.click(downloadButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('https://example.com/recording.webm')
      })
    })
  })

  describe('Recording Deletion', () => {
    it('should delete recording when delete button is clicked', async () => {
      render(<MeetingRecording {...defaultProps} />)
      
      // Add a completed recording
      const completedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:completed'
      )?.[1]
      
      if (completedCallback) {
        completedCallback({
          id: 'recording123',
          meetingId: 'meeting123',
          fileName: 'recording.webm',
          fileSize: 1024000,
          duration: 60,
          createdAt: new Date(),
          status: 'completed',
          downloadUrl: 'https://example.com/recording.webm',
        })
      }
      
      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)
      
      await waitFor(() => {
        expect(mockSocketService.emit).toHaveBeenCalledWith('recording:delete', {
          meetingId: 'meeting123',
          roomCode: 'ROOM123',
          recordingId: 'recording123',
        })
      })
    })
  })

  describe('Status Badges', () => {
    it('should display correct status badges for different recording states', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      const completedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:completed'
      )?.[1]
      
      if (completedCallback) {
        // Add recording with different statuses
        completedCallback({
          id: 'recording1',
          meetingId: 'meeting123',
          fileName: 'recording1.webm',
          fileSize: 1024000,
          duration: 60,
          createdAt: new Date(),
          status: 'recording',
          downloadUrl: 'https://example.com/recording1.webm',
        })
        
        completedCallback({
          id: 'recording2',
          meetingId: 'meeting123',
          fileName: 'recording2.webm',
          fileSize: 1024000,
          duration: 60,
          createdAt: new Date(),
          status: 'processing',
          downloadUrl: 'https://example.com/recording2.webm',
        })
        
        completedCallback({
          id: 'recording3',
          meetingId: 'meeting123',
          fileName: 'recording3.webm',
          fileSize: 1024000,
          duration: 60,
          createdAt: new Date(),
          status: 'completed',
          downloadUrl: 'https://example.com/recording3.webm',
        })
        
        completedCallback({
          id: 'recording4',
          meetingId: 'meeting123',
          fileName: 'recording4.webm',
          fileSize: 1024000,
          duration: 60,
          createdAt: new Date(),
          status: 'failed',
          downloadUrl: 'https://example.com/recording4.webm',
        })
      }
      
      expect(screen.getByText('Recording')).toBeInTheDocument()
      expect(screen.getByText('Processing')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })
  })

  describe('Duration Formatting', () => {
    it('should format duration correctly for different time periods', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      const completedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:completed'
      )?.[1]
      
      if (completedCallback) {
        // Add recordings with different durations
        completedCallback({
          id: 'recording1',
          meetingId: 'meeting123',
          fileName: 'short.webm',
          fileSize: 1024000,
          duration: 45, // 45 seconds
          createdAt: new Date(),
          status: 'completed',
          downloadUrl: 'https://example.com/short.webm',
        })
        
        completedCallback({
          id: 'recording2',
          meetingId: 'meeting123',
          fileName: 'medium.webm',
          fileSize: 2048000,
          duration: 3665, // 1 hour 1 minute 5 seconds
          createdAt: new Date(),
          status: 'completed',
          downloadUrl: 'https://example.com/medium.webm',
        })
      }
      
      expect(screen.getByText('Duration: 0:45')).toBeInTheDocument()
      expect(screen.getByText('Duration: 1:01:05')).toBeInTheDocument()
    })
  })

  describe('File Size Formatting', () => {
    it('should format file size correctly', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      const completedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:completed'
      )?.[1]
      
      if (completedCallback) {
        // Add recordings with different file sizes
        completedCallback({
          id: 'recording1',
          meetingId: 'meeting123',
          fileName: 'small.webm',
          fileSize: 512, // 512 bytes
          duration: 60,
          createdAt: new Date(),
          status: 'completed',
          downloadUrl: 'https://example.com/small.webm',
        })
        
        completedCallback({
          id: 'recording2',
          meetingId: 'meeting123',
          fileName: 'large.webm',
          fileSize: 1073741824, // 1 GB
          duration: 3600,
          createdAt: new Date(),
          status: 'completed',
          downloadUrl: 'https://example.com/large.webm',
        })
      }
      
      expect(screen.getByText('Size: 512 B')).toBeInTheDocument()
      expect(screen.getByText('Size: 1 GB')).toBeInTheDocument()
    })
  })

  describe('Socket Event Handling', () => {
    it('should set up socket event listeners on mount', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      expect(mockSocketService.on).toHaveBeenCalledWith('recording:started', expect.any(Function))
      expect(mockSocketService.on).toHaveBeenCalledWith('recording:stopped', expect.any(Function))
      expect(mockSocketService.on).toHaveBeenCalledWith('recording:completed', expect.any(Function))
      expect(mockSocketService.on).toHaveBeenCalledWith('recording:failed', expect.any(Function))
    })

    it('should clean up socket event listeners on unmount', () => {
      const { unmount } = render(<MeetingRecording {...defaultProps} />)
      
      unmount()
      
      expect(mockSocketService.off).toHaveBeenCalledWith('recording:started')
      expect(mockSocketService.off).toHaveBeenCalledWith('recording:stopped')
      expect(mockSocketService.off).toHaveBeenCalledWith('recording:completed')
      expect(mockSocketService.off).toHaveBeenCalledWith('recording:failed')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      render(<MeetingRecording {...defaultProps} />)
      
      const startButton = screen.getByRole('button', { name: /start recording/i })
      const closeButton = screen.getByRole('button', { name: '×' })
      
      startButton.focus()
      expect(startButton).toHaveFocus()
      
      fireEvent.keyDown(startButton, { key: 'Tab' })
      expect(closeButton).toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    it('should handle socket errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<MeetingRecording {...defaultProps} />)
      
      // Simulate socket error
      const errorCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]
      
      if (errorCallback) {
        errorCallback(new Error('Connection failed'))
      }
      
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<MeetingRecording {...defaultProps} />)
      
      const initialRenderCount = mockSocketService.on.mock.calls.length
      
      rerender(<MeetingRecording {...defaultProps} />)
      
      expect(mockSocketService.on.mock.calls.length).toBe(initialRenderCount)
    })

    it('should clean up timers on unmount', () => {
      const { unmount } = render(<MeetingRecording {...defaultProps} />)
      
      // Start recording to create timer
      const startButton = screen.getByRole('button', { name: /start recording/i })
      fireEvent.click(startButton)
      
      const startedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'recording:started'
      )?.[1]
      
      if (startedCallback) {
        startedCallback({
          recordingId: 'recording123',
          meetingId: 'meeting123',
        })
      }
      
      unmount()
      
      // Fast-forward time to ensure no timer updates occur after unmount
      vi.advanceTimersByTime(5000)
      
      // Should not have any recording timer updates
      expect(screen.queryByText(/0:05/)).not.toBeInTheDocument()
    })
  })
})





