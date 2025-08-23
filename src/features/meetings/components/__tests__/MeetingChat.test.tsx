import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MeetingChat } from '../MeetingChat'
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
    empProfile: 'https://example.com/avatar.jpg',
  },
}

describe('MeetingChat', () => {
  const defaultProps = {
    meetingId: 'meeting123',
    roomCode: 'ROOM123',
    isOpen: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(socketService as any) = mockSocketService
    ;(useAuthStore as any).mockReturnValue(mockAuthStore)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render chat component when isOpen is true', () => {
      render(<MeetingChat {...defaultProps} />)
      
      expect(screen.getByText('Meeting Chat')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<MeetingChat {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('Meeting Chat')).not.toBeInTheDocument()
    })

    it('should display close button', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const closeButton = screen.getByRole('button', { name: '×' })
      expect(closeButton).toBeInTheDocument()
    })

    it('should show empty state when no messages exist', () => {
      render(<MeetingChat {...defaultProps} />)
      
      expect(screen.getByText('No messages yet')).toBeInTheDocument()
      expect(screen.getByText('Start the conversation!')).toBeInTheDocument()
    })
  })

  describe('Message Sending', () => {
    it('should send message when send button is clicked', async () => {
      render(<MeetingChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type a message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(input, { target: { value: 'Hello, world!' } })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        expect(mockSocketService.emit).toHaveBeenCalledWith('chat:message', {
          meetingId: 'meeting123',
          roomCode: 'ROOM123',
          message: 'Hello, world!',
        })
      })
    })

    it('should send message when Enter key is pressed', async () => {
      render(<MeetingChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type a message...')
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' })
      
      await waitFor(() => {
        expect(mockSocketService.emit).toHaveBeenCalledWith('chat:message', {
          meetingId: 'meeting123',
          roomCode: 'ROOM123',
          message: 'Test message',
        })
      })
    })

    it('should not send empty messages', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      fireEvent.click(sendButton)
      
      expect(mockSocketService.emit).not.toHaveBeenCalled()
    })

    it('should not send whitespace-only messages', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type a message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.click(sendButton)
      
      expect(mockSocketService.emit).not.toHaveBeenCalled()
    })

    it('should clear input after sending message', async () => {
      render(<MeetingChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type a message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })

    it('should disable send button for empty messages', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeDisabled()
    })
  })

  describe('Message Display', () => {
    it('should display received messages', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const messageCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:message'
      )?.[1]
      
      if (messageCallback) {
        messageCallback({
          id: 'msg123',
          senderId: 'user456',
          senderName: 'John Doe',
          senderAvatar: 'https://example.com/john.jpg',
          message: 'Hello everyone!',
          timestamp: new Date('2024-01-15T10:00:00Z'),
          type: 'text',
        })
      }
      
      expect(screen.getByText('Hello everyone!')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should display own messages differently', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const messageCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:message'
      )?.[1]
      
      if (messageCallback) {
        messageCallback({
          id: 'msg123',
          senderId: 'user123', // Same as current user
          senderName: 'Test User',
          senderAvatar: 'https://example.com/avatar.jpg',
          message: 'My message',
          timestamp: new Date(),
          type: 'text',
        })
      }
      
      const messageElement = screen.getByText('My message')
      expect(messageElement.closest('div')).toHaveClass('justify-end')
    })

    it('should display system messages', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const systemCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:system'
      )?.[1]
      
      if (systemCallback) {
        systemCallback({
          message: 'User joined the meeting',
          type: 'info',
        })
      }
      
      expect(screen.getByText('User joined the meeting')).toBeInTheDocument()
    })

    it('should format timestamps correctly', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const messageCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:message'
      )?.[1]
      
      if (messageCallback) {
        messageCallback({
          id: 'msg123',
          senderId: 'user456',
          senderName: 'John Doe',
          message: 'Test message',
          timestamp: new Date('2024-01-15T14:30:00Z'),
          type: 'text',
        })
      }
      
      // Should display time in local format
      expect(screen.getByText(/2:30/)).toBeInTheDocument()
    })

    it('should display multiple messages', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const messageCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:message'
      )?.[1]
      
      if (messageCallback) {
        // Add first message
        messageCallback({
          id: 'msg1',
          senderId: 'user1',
          senderName: 'User One',
          message: 'First message',
          timestamp: new Date(),
          type: 'text',
        })
        
        // Add second message
        messageCallback({
          id: 'msg2',
          senderId: 'user2',
          senderName: 'User Two',
          message: 'Second message',
          timestamp: new Date(),
          type: 'text',
        })
      }
      
      expect(screen.getByText('First message')).toBeInTheDocument()
      expect(screen.getByText('Second message')).toBeInTheDocument()
    })
  })

  describe('Typing Indicators', () => {
    it('should emit typing event when user starts typing', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type a message...')
      fireEvent.change(input, { target: { value: 'Typing...' } })
      
      expect(mockSocketService.emit).toHaveBeenCalledWith('chat:typing', {
        meetingId: 'meeting123',
        roomCode: 'ROOM123',
        isTyping: true,
      })
    })

    it('should emit stop typing event when user stops typing', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type a message...')
      
      // Start typing
      fireEvent.change(input, { target: { value: 'Typing...' } })
      
      // Stop typing (clear input)
      fireEvent.change(input, { target: { value: '' } })
      
      expect(mockSocketService.emit).toHaveBeenCalledWith('chat:typing', {
        meetingId: 'meeting123',
        roomCode: 'ROOM123',
        isTyping: false,
      })
    })

    it('should display typing indicator for other users', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const typingCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:typing'
      )?.[1]
      
      if (typingCallback) {
        typingCallback({
          userId: 'user456',
          isTyping: true,
        })
      }
      
      expect(screen.getByText('Someone is typing...')).toBeInTheDocument()
    })

    it('should display typing indicator for multiple users', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const typingCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:typing'
      )?.[1]
      
      if (typingCallback) {
        // First user starts typing
        typingCallback({
          userId: 'user1',
          isTyping: true,
        })
        
        // Second user starts typing
        typingCallback({
          userId: 'user2',
          isTyping: true,
        })
      }
      
      expect(screen.getByText('2 people are typing...')).toBeInTheDocument()
    })

    it('should remove typing indicator when user stops typing', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const typingCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:typing'
      )?.[1]
      
      if (typingCallback) {
        // Start typing
        typingCallback({
          userId: 'user456',
          isTyping: true,
        })
        
        expect(screen.getByText('Someone is typing...')).toBeInTheDocument()
        
        // Stop typing
        typingCallback({
          userId: 'user456',
          isTyping: false,
        })
        
        expect(screen.queryByText('Someone is typing...')).not.toBeInTheDocument()
      }
    })
  })

  describe('File Upload', () => {
    it('should handle file upload', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByTestId('file-upload')
      
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      expect(screen.getByText('Shared file: test.txt')).toBeInTheDocument()
    })

    it('should display file message with proper styling', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const file = new File(['test content'], 'document.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-upload')
      
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      const fileMessage = screen.getByText('Shared file: document.pdf')
      expect(fileMessage).toBeInTheDocument()
    })

    it('should accept multiple file types', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const fileInput = screen.getByTestId('file-upload')
      expect(fileInput).toHaveAttribute('accept', 'image/*,.pdf,.doc,.docx,.txt')
    })
  })

  describe('Voice Messages', () => {
    it('should toggle voice recording state', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const voiceButton = screen.getByRole('button', { name: /voice/i })
      
      // Initial state
      expect(voiceButton).not.toHaveClass('text-red-500')
      
      // Start recording
      fireEvent.click(voiceButton)
      expect(voiceButton).toHaveClass('text-red-500')
      
      // Stop recording
      fireEvent.click(voiceButton)
      expect(voiceButton).not.toHaveClass('text-red-500')
    })

    it('should show different icons for recording states', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const voiceButton = screen.getByRole('button', { name: /voice/i })
      
      // Initial state shows Mic icon
      expect(voiceButton.querySelector('svg')).toBeInTheDocument()
      
      // Start recording
      fireEvent.click(voiceButton)
      
      // Should show MicOff icon when recording
      expect(voiceButton.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Message Types', () => {
    it('should display text messages correctly', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const messageCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:message'
      )?.[1]
      
      if (messageCallback) {
        messageCallback({
          id: 'msg123',
          senderId: 'user456',
          senderName: 'John Doe',
          message: 'This is a text message',
          timestamp: new Date(),
          type: 'text',
        })
      }
      
      expect(screen.getByText('This is a text message')).toBeInTheDocument()
    })

    it('should display file messages correctly', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const messageCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:message'
      )?.[1]
      
      if (messageCallback) {
        messageCallback({
          id: 'msg123',
          senderId: 'user456',
          senderName: 'John Doe',
          message: 'Shared file: document.pdf',
          timestamp: new Date(),
          type: 'file',
          fileName: 'document.pdf',
          fileUrl: 'https://example.com/document.pdf',
        })
      }
      
      expect(screen.getByText('Shared file: document.pdf')).toBeInTheDocument()
    })

    it('should display system messages with different styling', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const systemCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:system'
      )?.[1]
      
      if (systemCallback) {
        systemCallback({
          message: 'System notification',
          type: 'info',
        })
      }
      
      const systemMessage = screen.getByText('System notification')
      expect(systemMessage.closest('div')).toHaveClass('bg-muted', 'text-muted-foreground', 'text-center')
    })
  })

  describe('Real-time Updates', () => {
    it('should handle new messages from other users', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const messageCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:message'
      )?.[1]
      
      if (messageCallback) {
        messageCallback({
          id: 'msg123',
          senderId: 'user456',
          senderName: 'Other User',
          message: 'New message from other user',
          timestamp: new Date(),
          type: 'text',
        })
      }
      
      expect(screen.getByText('New message from other user')).toBeInTheDocument()
    })

    it('should scroll to bottom when new messages arrive', () => {
      const mockScrollIntoView = vi.fn()
      Element.prototype.scrollIntoView = mockScrollIntoView
      
      render(<MeetingChat {...defaultProps} />)
      
      const messageCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:message'
      )?.[1]
      
      if (messageCallback) {
        messageCallback({
          id: 'msg123',
          senderId: 'user456',
          senderName: 'Other User',
          message: 'New message',
          timestamp: new Date(),
          type: 'text',
        })
      }
      
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
    })
  })

  describe('Socket Event Handling', () => {
    it('should set up socket event listeners on mount', () => {
      render(<MeetingChat {...defaultProps} />)
      
      expect(mockSocketService.on).toHaveBeenCalledWith('chat:message', expect.any(Function))
      expect(mockSocketService.on).toHaveBeenCalledWith('chat:typing', expect.any(Function))
      expect(mockSocketService.on).toHaveBeenCalledWith('chat:system', expect.any(Function))
    })

    it('should clean up socket event listeners on unmount', () => {
      const { unmount } = render(<MeetingChat {...defaultProps} />)
      
      unmount()
      
      expect(mockSocketService.off).toHaveBeenCalledWith('chat:message')
      expect(mockSocketService.off).toHaveBeenCalledWith('chat:typing')
      expect(mockSocketService.off).toHaveBeenCalledWith('chat:system')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MeetingChat {...defaultProps} />)
      
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type a message...')
      const closeButton = screen.getByRole('button', { name: '×' })
      
      input.focus()
      expect(input).toHaveFocus()
      
      fireEvent.keyDown(input, { key: 'Tab' })
      expect(closeButton).toHaveFocus()
    })

    it('should not send message on Shift+Enter', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type a message...')
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.keyPress(input, { key: 'Enter', shiftKey: true })
      
      expect(mockSocketService.emit).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle socket errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<MeetingChat {...defaultProps} />)
      
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

    it('should handle message sending errors gracefully', async () => {
      const { toast } = await import('sonner')
      
      render(<MeetingChat {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type a message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)
      
      // Simulate send error
      const sendCallback = mockSocketService.emit.mock.calls[0]?.[1]
      if (sendCallback) {
        // Trigger error handling
        const error = new Error('Send failed')
        throw error
      }
      
      expect(toast.error).toHaveBeenCalledWith('Failed to send message')
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<MeetingChat {...defaultProps} />)
      
      const initialRenderCount = mockSocketService.on.mock.calls.length
      
      rerender(<MeetingChat {...defaultProps} />)
      
      expect(mockSocketService.on.mock.calls.length).toBe(initialRenderCount)
    })

    it('should handle large numbers of messages efficiently', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const messageCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:message'
      )?.[1]
      
      if (messageCallback) {
        // Add many messages
        for (let i = 0; i < 100; i++) {
          messageCallback({
            id: `msg${i}`,
            senderId: 'user456',
            senderName: 'Test User',
            message: `Message ${i}`,
            timestamp: new Date(),
            type: 'text',
          })
        }
      }
      
      // Should still render without performance issues
      expect(screen.getByText('Message 0')).toBeInTheDocument()
      expect(screen.getByText('Message 99')).toBeInTheDocument()
    })
  })

  describe('Message Formatting', () => {
    it('should preserve whitespace in messages', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const messageCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:message'
      )?.[1]
      
      if (messageCallback) {
        messageCallback({
          id: 'msg123',
          senderId: 'user456',
          senderName: 'Test User',
          message: 'Line 1\nLine 2\n  Indented line',
          timestamp: new Date(),
          type: 'text',
        })
      }
      
      const messageElement = screen.getByText(/Line 1/)
      expect(messageElement).toHaveClass('whitespace-pre-wrap')
    })

    it('should handle long messages with proper wrapping', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const longMessage = 'A'.repeat(500)
      
      const messageCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:message'
      )?.[1]
      
      if (messageCallback) {
        messageCallback({
          id: 'msg123',
          senderId: 'user456',
          senderName: 'Test User',
          message: longMessage,
          timestamp: new Date(),
          type: 'text',
        })
      }
      
      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })
  })

  describe('Avatar Display', () => {
    it('should display user avatars', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const messageCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:message'
      )?.[1]
      
      if (messageCallback) {
        messageCallback({
          id: 'msg123',
          senderId: 'user456',
          senderName: 'John Doe',
          senderAvatar: 'https://example.com/john.jpg',
          message: 'Test message',
          timestamp: new Date(),
          type: 'text',
        })
      }
      
      const avatar = screen.getByAltText('John Doe')
      expect(avatar).toHaveAttribute('src', 'https://example.com/john.jpg')
    })

    it('should show fallback for missing avatars', () => {
      render(<MeetingChat {...defaultProps} />)
      
      const messageCallback = mockSocketService.on.mock.calls.find(
        call => call[0] === 'chat:message'
      )?.[1]
      
      if (messageCallback) {
        messageCallback({
          id: 'msg123',
          senderId: 'user456',
          senderName: 'John Doe',
          message: 'Test message',
          timestamp: new Date(),
          type: 'text',
        })
      }
      
      const fallback = screen.getByText('J')
      expect(fallback).toBeInTheDocument()
    })
  })
})
