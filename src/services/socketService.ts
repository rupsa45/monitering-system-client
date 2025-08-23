import { io, Socket } from 'socket.io-client'
import { SOCKET_CONFIG } from '@/utils/meetingUtils'

// Socket.IO Event Types
export interface SocketEvents {
  // Connection events
  connect: () => void
  disconnect: (reason: string) => void
  connect_error: (error: Error) => void
  
  // Meeting events
  'peer:joined': (data: {
    empId: string
    empName: string
    role: 'HOST' | 'COHOST' | 'PARTICIPANT'
    socketId: string
  }) => void
  'peer:left': (data: { empId: string }) => void
  
  // WebRTC signaling events
  'signal:offer': (data: {
    fromEmpId: string
    offer: RTCSessionDescriptionInit
  }) => void
  'signal:answer': (data: {
    fromEmpId: string
    answer: RTCSessionDescriptionInit
  }) => void
  'signal:ice': (data: {
    fromEmpId: string
    candidate: RTCIceCandidateInit
  }) => void
  
  // Host control events
  'host:kicked': (data: { reason: string }) => void
  'host:banned': (data: { reason: string }) => void
  'host:ended': (data: { reason: string }) => void
  
  // Room events
  'room:joined': (data: { roomId: string }) => void
  'room:left': (data: { roomId: string }) => void
  
  // Error events
  error: (data: { message: string }) => void
}

// Socket Service Class
export class SocketService {
  private socket: Socket | null = null
  private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = SOCKET_CONFIG.reconnectAttempts

  // Connection Management
  connect(serverUrl: string = SOCKET_CONFIG.serverUrl, accessToken?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Disconnect existing connection
        if (this.socket) {
          this.socket.disconnect()
        }

        // Create new connection
        this.socket = io(`${serverUrl}${SOCKET_CONFIG.namespace}`, {
          auth: accessToken ? { meetingAccessToken: accessToken } : undefined,
          timeout: SOCKET_CONFIG.timeout,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: SOCKET_CONFIG.reconnectDelay,
          reconnectionDelayMax: 5000,
          maxReconnectionAttempts: this.maxReconnectAttempts
        })

        // Setup event listeners
        this.setupEventListeners()

        // Handle connection
        this.socket.on('connect', () => {
          // Connected to Socket.IO server
          this.reconnectAttempts = 0
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          // Socket.IO connection error
          reject(error)
        })

        this.socket.on('disconnect', (reason) => {
          // Disconnected from Socket.IO server
          if (reason === 'io server disconnect') {
            // Server disconnected us, don't reconnect
            this.reconnectAttempts = this.maxReconnectAttempts
          }
        })

        this.socket.on('reconnect_attempt', (attemptNumber) => {
          // Reconnection attempt
          this.reconnectAttempts = attemptNumber
        })

        this.socket.on('reconnect_failed', () => {
          // Failed to reconnect to Socket.IO server
          reject(new Error('Failed to reconnect'))
        })

      } catch (error) {
        // Failed to create Socket.IO connection
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.eventListeners.clear()
  }

  // Event Management
  on<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    if (!this.socket) {
      // Socket not connected, cannot add event listener
      return
    }

    // Store callback for cleanup
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback as (...args: unknown[]) => void)

    // Add socket listener
    this.socket.on(event, callback as (...args: unknown[]) => void)
  }

  off<T extends keyof SocketEvents>(event: T, callback?: SocketEvents[T]): void {
    if (!this.socket) return

    if (callback) {
      // Remove specific callback
      this.socket.off(event, callback as (...args: unknown[]) => void)
      const listeners = this.eventListeners.get(event)
      if (listeners) {
        const index = listeners.indexOf(callback as Function)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    } else {
      // Remove all listeners for this event
      this.socket.off(event as string)
      this.eventListeners.delete(event)
    }
  }

  emit(event: string, data?: unknown): void {
    if (!this.socket) {
      // Socket not connected, cannot emit event
      return
    }

    this.socket.emit(event, data)
  }

  // Meeting-specific methods
  joinRoom(roomId: string): void {
    this.emit('joinRoom', { roomId })
  }

  leaveRoom(roomId: string): void {
    this.emit('leaveRoom', { roomId })
  }

  // WebRTC signaling methods
  sendOffer(targetEmpId: string, offer: RTCSessionDescriptionInit): void {
    this.emit('signal:offer', {
      targetEmpId,
      offer
    })
  }

  sendAnswer(targetEmpId: string, answer: RTCSessionDescriptionInit): void {
    this.emit('signal:answer', {
      targetEmpId,
      answer
    })
  }

  sendIceCandidate(targetEmpId: string, candidate: RTCIceCandidateInit): void {
    this.emit('signal:ice', {
      targetEmpId,
      candidate
    })
  }

  // Host control methods
  kickParticipant(empId: string, reason?: string): void {
    this.emit('host:kick', {
      empId,
      reason: reason || 'Kicked by host'
    })
  }

  banParticipant(empId: string, reason?: string): void {
    this.emit('host:ban', {
      empId,
      reason: reason || 'Banned by host'
    })
  }

  endMeeting(reason?: string): void {
    this.emit('host:end', {
      reason: reason || 'Meeting ended by host'
    })
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getSocketId(): string | undefined {
    return this.socket?.id
  }

  // Private methods
  private setupEventListeners(): void {
    if (!this.socket) return

    // Log all events for debugging
    this.socket.onAny((_eventName, ..._args) => {
      // Socket event
    })

    // Handle errors
    this.socket.on('error', (_data) => {
      // Socket error
    })
  }

  // Cleanup method
  cleanup(): void {
    this.disconnect()
  }
}

// Create singleton instance
export const socketService = new SocketService()

// Export types for external use
export type { SocketEvents }
