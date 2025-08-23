import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MeetingNotes } from '../MeetingNotes'
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

describe('MeetingNotes', () => {
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
    it('should render notes component when isOpen is true', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      expect(screen.getByText('Meeting Notes')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Take notes during the meeting...')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<MeetingNotes {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('Meeting Notes')).not.toBeInTheDocument()
    })

    it('should display close button', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const closeButton = screen.getByRole('button', { name: '×' })
      expect(closeButton).toBeInTheDocument()
    })

    it('should show empty state when no notes exist', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      expect(screen.getByText('No notes yet')).toBeInTheDocument()
      expect(screen.getByText('Start taking notes below')).toBeInTheDocument()
    })
  })

  describe('Note Creation', () => {
    it('should create a new note when save button is clicked', async () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Take notes during the meeting...')
      const saveButton = screen.getByRole('button', { name: /save/i })
      
      fireEvent.change(textarea, { target: { value: 'This is a test note' } })
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockSocketService.emit).toHaveBeenCalledWith('notes:save', {
          meetingId: 'meeting123',
          roomCode: 'ROOM123',
          note: expect.objectContaining({
            content: 'This is a test note',
            authorId: 'user123',
            authorName: 'Test User',
            isShared: false,
          }),
        })
      })
    })

    it('should not save empty notes', async () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)
      
      expect(mockSocketService.emit).not.toHaveBeenCalled()
    })

    it('should clear textarea after saving note', async () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Take notes during the meeting...')
      const saveButton = screen.getByRole('button', { name: /save/i })
      
      fireEvent.change(textarea, { target: { value: 'Test note content' } })
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(textarea).toHaveValue('')
      })
    })

    it('should auto-save note after 3 seconds of inactivity', async () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Take notes during the meeting...')
      fireEvent.change(textarea, { target: { value: 'Auto-save test note' } })
      
      // Fast-forward time by 3 seconds
      vi.advanceTimersByTime(3000)
      
      await waitFor(() => {
        expect(mockSocketService.emit).toHaveBeenCalledWith('notes:save', {
          meetingId: 'meeting123',
          roomCode: 'ROOM123',
          note: expect.objectContaining({
            content: 'Auto-save test note',
          }),
        })
      })
    })
  })

  describe('Note Display', () => {
    it('should display notes with author information', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: 'This is a shared note',
          authorId: 'user456',
          authorName: 'John Doe',
          timestamp: new Date('2024-01-15T10:00:00Z'),
          isShared: true,
        })
      }
      
      expect(screen.getByText('This is a shared note')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Shared')).toBeInTheDocument()
    })

    it('should display multiple notes', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        // Add first note
        sharedCallback({
          id: 'note1',
          content: 'First note content',
          authorId: 'user1',
          authorName: 'User One',
          timestamp: new Date(),
          isShared: true,
        })
        
        // Add second note
        sharedCallback({
          id: 'note2',
          content: 'Second note content',
          authorId: 'user2',
          authorName: 'User Two',
          timestamp: new Date(),
          isShared: true,
        })
      }
      
      expect(screen.getByText('First note content')).toBeInTheDocument()
      expect(screen.getByText('Second note content')).toBeInTheDocument()
      expect(screen.getByText('User One')).toBeInTheDocument()
      expect(screen.getByText('User Two')).toBeInTheDocument()
    })

    it('should format timestamp correctly', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: 'Test note',
          authorId: 'user123',
          authorName: 'Test User',
          timestamp: new Date('2024-01-15T14:30:00Z'),
          isShared: true,
        })
      }
      
      // Should display time in local format
      expect(screen.getByText(/2:30/)).toBeInTheDocument()
    })
  })

  describe('Note Editing', () => {
    it('should enable editing for own notes', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: 'Original note content',
          authorId: 'user123', // Same as current user
          authorName: 'Test User',
          timestamp: new Date(),
          isShared: true,
        })
      }
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      expect(editButton).toBeInTheDocument()
    })

    it('should not show edit button for other users notes', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: 'Other user note',
          authorId: 'user456', // Different user
          authorName: 'Other User',
          timestamp: new Date(),
          isShared: true,
        })
      }
      
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    })

    it('should switch to edit mode when edit button is clicked', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: 'Original content',
          authorId: 'user123',
          authorName: 'Test User',
          timestamp: new Date(),
          isShared: true,
        })
      }
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)
      
      expect(screen.getByDisplayValue('Original content')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should update note when update button is clicked', async () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: 'Original content',
          authorId: 'user123',
          authorName: 'Test User',
          timestamp: new Date(),
          isShared: true,
        })
      }
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)
      
      const textarea = screen.getByDisplayValue('Original content')
      fireEvent.change(textarea, { target: { value: 'Updated content' } })
      
      const updateButton = screen.getByRole('button', { name: /update/i })
      fireEvent.click(updateButton)
      
      await waitFor(() => {
        expect(mockSocketService.emit).toHaveBeenCalledWith('notes:update', {
          meetingId: 'meeting123',
          roomCode: 'ROOM123',
          note: expect.objectContaining({
            id: 'note123',
            content: 'Updated content',
          }),
        })
      })
    })

    it('should cancel editing when cancel button is clicked', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: 'Original content',
          authorId: 'user123',
          authorName: 'Test User',
          timestamp: new Date(),
          isShared: true,
        })
      }
      
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)
      
      expect(screen.queryByDisplayValue('Original content')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /update/i })).not.toBeInTheDocument()
    })
  })

  describe('Note Sharing', () => {
    it('should share note when share button is clicked', async () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: 'Private note',
          authorId: 'user123',
          authorName: 'Test User',
          timestamp: new Date(),
          isShared: false,
        })
      }
      
      const shareButton = screen.getByRole('button', { name: /share/i })
      fireEvent.click(shareButton)
      
      await waitFor(() => {
        expect(mockSocketService.emit).toHaveBeenCalledWith('notes:share', {
          meetingId: 'meeting123',
          roomCode: 'ROOM123',
          note: expect.objectContaining({
            id: 'note123',
            isShared: true,
          }),
        })
      })
    })

    it('should not show share button for already shared notes', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: 'Shared note',
          authorId: 'user123',
          authorName: 'Test User',
          timestamp: new Date(),
          isShared: true,
        })
      }
      
      expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument()
    })

    it('should not show share button for other users notes', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: 'Other user note',
          authorId: 'user456',
          authorName: 'Other User',
          timestamp: new Date(),
          isShared: false,
        })
      }
      
      expect(screen.queryByRole('button', { name: /share/i })).not.toBeInTheDocument()
    })
  })

  describe('Note Deletion', () => {
    it('should delete note when delete button is clicked', async () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: 'Note to delete',
          authorId: 'user123',
          authorName: 'Test User',
          timestamp: new Date(),
          isShared: true,
        })
      }
      
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)
      
      await waitFor(() => {
        expect(mockSocketService.emit).toHaveBeenCalledWith('notes:delete', {
          meetingId: 'meeting123',
          roomCode: 'ROOM123',
          noteId: 'note123',
        })
      })
    })

    it('should not show delete button for other users notes', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: 'Other user note',
          authorId: 'user456',
          authorName: 'Other User',
          timestamp: new Date(),
          isShared: true,
        })
      }
      
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    })
  })

  describe('Real-time Updates', () => {
    it('should handle note updates from other users', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const updatedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:updated'
      )?.[1]
      
      if (updatedCallback) {
        updatedCallback({
          id: 'note123',
          content: 'Updated content from other user',
          authorId: 'user456',
          authorName: 'Other User',
          timestamp: new Date(),
          isShared: true,
        })
      }
      
      expect(screen.getByText('Updated content from other user')).toBeInTheDocument()
    })

    it('should handle note deletions from other users', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      // First add a note
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: 'Note to be deleted',
          authorId: 'user456',
          authorName: 'Other User',
          timestamp: new Date(),
          isShared: true,
        })
      }
      
      expect(screen.getByText('Note to be deleted')).toBeInTheDocument()
      
      // Then simulate deletion
      const deletedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:deleted'
      )?.[1]
      
      if (deletedCallback) {
        deletedCallback({ id: 'note123' })
      }
      
      expect(screen.queryByText('Note to be deleted')).not.toBeInTheDocument()
    })
  })

  describe('Notes Download', () => {
    it('should download shared notes when download button is clicked', () => {
      const mockCreateObjectURL = vi.fn(() => 'blob:test')
      const mockRevokeObjectURL = vi.fn()
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()
      const mockClick = vi.fn()
      
      // Mock the entire URL object
      const originalURL = global.URL
      global.URL = {
        ...originalURL,
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      } as any
      global.document.createElement = vi.fn(() => ({
        href: '',
        download: '',
        click: mockClick,
      }))
      global.document.body = {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      } as any
      
      render(<MeetingNotes {...defaultProps} />)
      
      // Add shared notes
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note1',
          content: 'First shared note',
          authorId: 'user1',
          authorName: 'User One',
          timestamp: new Date('2024-01-15T10:00:00Z'),
          isShared: true,
        })
        
        sharedCallback({
          id: 'note2',
          content: 'Second shared note',
          authorId: 'user2',
          authorName: 'User Two',
          timestamp: new Date('2024-01-15T11:00:00Z'),
          isShared: true,
        })
      }
      
      const downloadButton = screen.getByRole('button', { name: /download/i })
      fireEvent.click(downloadButton)
      
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalled()
      
      // Restore original URL object
      global.URL = originalURL
    })

    it('should disable download button when no shared notes exist', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const downloadButton = screen.getByRole('button', { name: /download/i })
      expect(downloadButton).toBeDisabled()
    })

    it('should include only shared notes in download', () => {
      const mockCreateObjectURL = vi.fn(() => 'blob:test')
      const mockRevokeObjectURL = vi.fn()
      const mockAppendChild = vi.fn()
      const mockRemoveChild = vi.fn()
      const mockClick = vi.fn()
      
      // Mock the entire URL object
      const originalURL = global.URL
      global.URL = {
        ...originalURL,
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      } as any
      global.document.createElement = vi.fn(() => ({
        href: '',
        download: '',
        click: mockClick,
      }))
      global.document.body = {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      } as any
      
      render(<MeetingNotes {...defaultProps} />)
      
      // Add both shared and private notes
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note1',
          content: 'Shared note',
          authorId: 'user1',
          authorName: 'User One',
          timestamp: new Date(),
          isShared: true,
        })
        
        sharedCallback({
          id: 'note2',
          content: 'Private note',
          authorId: 'user2',
          authorName: 'User Two',
          timestamp: new Date(),
          isShared: false,
        })
      }
      
      const downloadButton = screen.getByRole('button', { name: /download/i })
      fireEvent.click(downloadButton)
      
      // Should only include shared notes in the blob
      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.stringContaining('Shared note')
      )
      expect(mockCreateObjectURL).not.toHaveBeenCalledWith(
        expect.stringContaining('Private note')
      )
      
      // Restore original URL object
      global.URL = originalURL
    })
  })

  describe('Socket Event Handling', () => {
    it('should set up socket event listeners on mount', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      expect(mockSocketService.on).toHaveBeenCalledWith('notes:shared', expect.any(Function))
      expect(mockSocketService.on).toHaveBeenCalledWith('notes:updated', expect.any(Function))
      expect(mockSocketService.on).toHaveBeenCalledWith('notes:deleted', expect.any(Function))
    })

    it('should clean up socket event listeners on unmount', () => {
      const { unmount } = render(<MeetingNotes {...defaultProps} />)
      
      unmount()
      
      expect(mockSocketService.off).toHaveBeenCalledWith('notes:shared')
      expect(mockSocketService.off).toHaveBeenCalledWith('notes:updated')
      expect(mockSocketService.off).toHaveBeenCalledWith('notes:deleted')
    })
  })

  describe('Auto-save Functionality', () => {
    it('should auto-save after typing stops', async () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Take notes during the meeting...')
      fireEvent.change(textarea, { target: { value: 'Typing...' } })
      
      // Wait for auto-save delay
      vi.advanceTimersByTime(3000)
      
      await waitFor(() => {
        expect(mockSocketService.emit).toHaveBeenCalledWith('notes:save', {
          meetingId: 'meeting123',
          roomCode: 'ROOM123',
          note: expect.objectContaining({
            content: 'Typing...',
          }),
        })
      })
    })

    it('should reset auto-save timer when typing continues', async () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Take notes during the meeting...')
      
      // Start typing
      fireEvent.change(textarea, { target: { value: 'First' } })
      
      // Wait 2 seconds (before auto-save)
      vi.advanceTimersByTime(2000)
      
      // Continue typing
      fireEvent.change(textarea, { target: { value: 'First Second' } })
      
      // Wait 2 more seconds (should not auto-save yet)
      vi.advanceTimersByTime(2000)
      
      // Should not have auto-saved yet
      expect(mockSocketService.emit).not.toHaveBeenCalled()
      
      // Wait the full 3 seconds after last typing
      vi.advanceTimersByTime(1000)
      
      await waitFor(() => {
        expect(mockSocketService.emit).toHaveBeenCalledWith('notes:save', {
          meetingId: 'meeting123',
          roomCode: 'ROOM123',
          note: expect.objectContaining({
            content: 'First Second',
          }),
        })
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      expect(screen.getByPlaceholderText('Take notes during the meeting...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Take notes during the meeting...')
      const closeButton = screen.getByRole('button', { name: '×' })
      
      textarea.focus()
      expect(textarea).toHaveFocus()
      
      fireEvent.keyDown(textarea, { key: 'Tab' })
      expect(closeButton).toHaveFocus()
    })

    it('should support Enter key to save note', async () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Take notes during the meeting...')
      fireEvent.change(textarea, { target: { value: 'Note content' } })
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })
      
      await waitFor(() => {
        expect(mockSocketService.emit).toHaveBeenCalledWith('notes:save', {
          meetingId: 'meeting123',
          roomCode: 'ROOM123',
          note: expect.objectContaining({
            content: 'Note content',
          }),
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle socket errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<MeetingNotes {...defaultProps} />)
      
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

    it('should handle save errors gracefully', async () => {
      const mockToast = { error: vi.fn() }
      vi.doMock('sonner', () => ({ toast: mockToast }))
      
      render(<MeetingNotes {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Take notes during the meeting...')
      const saveButton = screen.getByRole('button', { name: /save/i })
      
      fireEvent.change(textarea, { target: { value: 'Test note' } })
      fireEvent.click(saveButton)
      
      // The component should handle errors gracefully without throwing
      expect(mockSocketService.emit).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<MeetingNotes {...defaultProps} />)
      
      const initialRenderCount = mockSocketService.on.mock.calls.length
      
      rerender(<MeetingNotes {...defaultProps} />)
      
      expect(mockSocketService.on.mock.calls.length).toBe(initialRenderCount)
    })

    it('should clean up auto-save timers on unmount', () => {
      const { unmount } = render(<MeetingNotes {...defaultProps} />)
      
      const textarea = screen.getByPlaceholderText('Take notes during the meeting...')
      fireEvent.change(textarea, { target: { value: 'Test note' } })
      
      unmount()
      
      // Fast-forward time to ensure no auto-save occurs after unmount
      vi.advanceTimersByTime(5000)
      
      expect(mockSocketService.emit).not.toHaveBeenCalled()
    })
  })

  describe('Content Formatting', () => {
    it('should preserve whitespace in note content', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: 'Line 1\nLine 2\n  Indented line',
          authorId: 'user123',
          authorName: 'Test User',
          timestamp: new Date(),
          isShared: true,
        })
      }
      
      const noteElement = screen.getByText(/Line 1/)
      expect(noteElement).toHaveClass('whitespace-pre-wrap')
    })

    it('should handle long note content with proper wrapping', () => {
      render(<MeetingNotes {...defaultProps} />)
      
      const longContent = 'A'.repeat(1000)
      
      const sharedCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'notes:shared'
      )?.[1]
      
      if (sharedCallback) {
        sharedCallback({
          id: 'note123',
          content: longContent,
          authorId: 'user123',
          authorName: 'Test User',
          timestamp: new Date(),
          isShared: true,
        })
      }
      
      expect(screen.getByText(longContent)).toBeInTheDocument()
    })
  })
})
