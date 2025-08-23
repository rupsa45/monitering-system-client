import { WEBRTC_CONFIG } from '@/utils/meetingUtils'

// WebRTC Connection Types
export interface PeerConnection {
  id: string
  connection: RTCPeerConnection
  remoteStream: MediaStream | null
  localStream: MediaStream | null
  isConnected: boolean
  isConnecting: boolean
}

export interface MediaConstraints {
  video: boolean | MediaTrackConstraints
  audio: boolean | MediaTrackConstraints
}

// WebRTC Statistics Interface
export interface WebRTCStats {
  peerId: string
  quality: 'high' | 'medium' | 'low'
  bandwidth: number
  packetsLost: number
  roundTripTime: number
  jitter: number
  timestamp: number
}

// WebRTC Settings Interface
export interface WebRTCSettings {
  videoQuality: 'high' | 'medium' | 'low'
  audioQuality: 'high' | 'medium' | 'low'
  bandwidthLimit: number
  enableAdaptiveQuality: boolean
  enableBandwidthOptimization: boolean
}

// WebRTC Service Class
export class WebRTCService {
  private peerConnections: Map<string, PeerConnection> = new Map()
  private localStream: MediaStream | null = null
  private screenShareStream: MediaStream | null = null
  private iceServers = WEBRTC_CONFIG.iceServers
  private settings: WebRTCSettings = {
    videoQuality: 'high',
    audioQuality: 'high',
    bandwidthLimit: 0,
    enableAdaptiveQuality: true,
    enableBandwidthOptimization: true
  }
  private statsInterval: NodeJS.Timeout | null = null
  private reconnectionAttempts: Map<string, number> = new Map()
  private maxReconnectionAttempts = 5

  // Event callbacks (to be set by external code)
  onIceCandidate?: (peerId: string, candidate: RTCIceCandidate) => void
  onPeerConnected?: (peerId: string) => void
  onPeerDisconnected?: (peerId: string) => void
  onRemoteStream?: (peerId: string, stream: MediaStream) => void
  onDataChannel?: (peerId: string, channel: RTCDataChannel) => void
  onStatsUpdate?: (stats: WebRTCStats[]) => void
  onReconnectionAttempt?: (peerId: string, attempt: number) => void

  // Local Media Stream Management
  async initializeLocalStream(constraints: MediaConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      if (this.localStream) {
        await this.stopLocalStream()
      }

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      return this.localStream
    } catch (error) {
      throw new Error(`Failed to access camera/microphone: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  async stopLocalStream(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }
  }

  // Peer Connection Management
  createPeerConnection(peerId: string): RTCPeerConnection {
    const connection = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10
    })

    // Add local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        connection.addTrack(track, this.localStream!)
      })
    }

    // Set up peer connection events
    this.setupPeerConnectionEvents(peerId, connection)

    // Store peer connection
    this.peerConnections.set(peerId, {
      id: peerId,
      connection,
      remoteStream: null,
      localStream: this.localStream,
      isConnected: false,
      isConnecting: true
    })

    return connection
  }

  getPeerConnection(peerId: string): RTCPeerConnection | null {
    const peerConnection = this.peerConnections.get(peerId)
    return peerConnection ? peerConnection.connection : null
  }

  async closePeerConnection(peerId: string): Promise<void> {
    const peerConnection = this.peerConnections.get(peerId)
    if (peerConnection) {
      peerConnection.connection.close()
      this.peerConnections.delete(peerId)
      this.reconnectionAttempts.delete(peerId)
    }
  }

  async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.peerConnections.keys()).map(peerId => 
      this.closePeerConnection(peerId)
    )
    await Promise.all(closePromises)
  }

  // WebRTC Signaling
  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peerConnections.get(peerId)
    if (!peerConnection) {
      throw new Error('Peer connection not found')
    }

    const offer = await peerConnection.connection.createOffer()
    await peerConnection.connection.setLocalDescription(offer)
    return offer
  }

  async createAnswer(peerId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peerConnections.get(peerId)
    if (!peerConnection) {
      throw new Error('Peer connection not found')
    }

    const answer = await peerConnection.connection.createAnswer()
    await peerConnection.connection.setLocalDescription(answer)
    return answer
  }

  async setRemoteDescription(peerId: string, description: RTCSessionDescriptionInit): Promise<void> {
    const peerConnection = this.peerConnections.get(peerId)
    if (!peerConnection) {
      throw new Error('Peer connection not found')
    }

    await peerConnection.connection.setRemoteDescription(description)
  }

  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConnection = this.peerConnections.get(peerId)
    if (!peerConnection) {
      throw new Error('Peer connection not found')
    }

    await peerConnection.connection.addIceCandidate(candidate)
  }

  // Stream Management
  getRemoteStream(peerId: string): MediaStream | null {
    const peerConnection = this.peerConnections.get(peerId)
    return peerConnection ? peerConnection.remoteStream : null
  }

  getAllRemoteStreams(): MediaStream[] {
    return Array.from(this.peerConnections.values())
      .map(peer => peer.remoteStream)
      .filter((stream): stream is MediaStream => stream !== null)
  }

  // Media Control
  async toggleVideo(enabled: boolean): Promise<void> {
    if (!this.localStream) return

    const videoTracks = this.localStream.getVideoTracks()
    videoTracks.forEach(track => {
      track.enabled = enabled
    })
  }

  async toggleAudio(enabled: boolean): Promise<void> {
    if (!this.localStream) return

    const audioTracks = this.localStream.getAudioTracks()
    audioTracks.forEach(track => {
      track.enabled = enabled
    })
  }

  async switchCamera(): Promise<void> {
    if (!this.localStream) return

    const videoTracks = this.localStream.getVideoTracks()
    if (videoTracks.length === 0) return

    const currentTrack = videoTracks[0]
    const currentDeviceId = currentTrack.getSettings().deviceId

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (videoDevices.length <= 1) return

      const nextDevice = videoDevices.find(device => device.deviceId !== currentDeviceId) || videoDevices[0]
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDevice.deviceId } },
        audio: false
      })

      const newVideoTrack = newStream.getVideoTracks()[0]
      
      // Replace track in all peer connections
      this.peerConnections.forEach(peer => {
        const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video')
        if (sender) {
          sender.replaceTrack(newVideoTrack)
        }
      })

      // Stop old track
      currentTrack.stop()
      
      // Update local stream
      if (this.localStream) {
        const oldVideoTrack = this.localStream.getVideoTracks()[0]
        this.localStream.removeTrack(oldVideoTrack)
        this.localStream.addTrack(newVideoTrack)
      }
    } catch (error) {
      console.error('Failed to switch camera:', error)
    }
  }

  // Screen Sharing
  async startScreenShare(): Promise<MediaStream> {
    try {
      this.screenShareStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })

      const videoTrack = this.screenShareStream.getVideoTracks()[0]
      
      // Replace video track in all peer connections
      this.peerConnections.forEach(peer => {
        const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video')
        if (sender) {
          sender.replaceTrack(videoTrack)
        }
      })

      return this.screenShareStream
    } catch (error) {
      throw new Error(`Failed to start screen sharing: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async stopScreenShare(): Promise<void> {
    if (this.screenShareStream) {
      this.screenShareStream.getTracks().forEach(track => track.stop())
      this.screenShareStream = null

      // Restore camera video track
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0]
        if (videoTrack) {
          this.peerConnections.forEach(peer => {
            const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video')
            if (sender) {
              sender.replaceTrack(videoTrack)
            }
          })
        }
      }
    }
  }

  // Connection Status
  isPeerConnected(peerId: string): boolean {
    const peerConnection = this.peerConnections.get(peerId)
    return peerConnection ? peerConnection.isConnected : false
  }

  isPeerConnecting(peerId: string): boolean {
    const peerConnection = this.peerConnections.get(peerId)
    return peerConnection ? peerConnection.isConnecting : false
  }

  getConnectedPeers(): string[] {
    return Array.from(this.peerConnections.entries())
      .filter(([_, peer]) => peer.isConnected)
      .map(([peerId, _]) => peerId)
  }

  getTotalConnections(): number {
    return this.peerConnections.size
  }

  // Statistics and Monitoring
  async getConnectionStats(peerId: string): Promise<WebRTCStats | null> {
    const peerConnection = this.peerConnections.get(peerId)
    if (!peerConnection) return null

    try {
      const stats = await peerConnection.connection.getStats()
      const statsData: WebRTCStats = {
        peerId,
        quality: 'medium',
        bandwidth: 0,
        packetsLost: 0,
        roundTripTime: 0,
        jitter: 0,
        timestamp: Date.now()
      }

      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          statsData.bandwidth = report.bytesReceived || 0
          statsData.packetsLost = report.packetsLost || 0
          statsData.jitter = report.jitter || 0
        }
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          statsData.roundTripTime = report.currentRoundTripTime || 0
        }
      })

      // Determine quality based on metrics
      if (statsData.packetsLost > 5 || statsData.bandwidth < 500000) {
        statsData.quality = 'low'
      } else if (statsData.packetsLost > 2 || statsData.bandwidth < 1000000) {
        statsData.quality = 'medium'
      } else {
        statsData.quality = 'high'
      }

      return statsData
    } catch (error) {
      console.error('Failed to get connection stats:', error)
      return null
    }
  }

  async getAllConnectionStats(): Promise<WebRTCStats[]> {
    const statsPromises = Array.from(this.peerConnections.keys()).map(peerId => 
      this.getConnectionStats(peerId)
    )
    const stats = await Promise.all(statsPromises)
    return stats.filter((stat): stat is WebRTCStats => stat !== null)
  }

  startStatsMonitoring(intervalMs: number = 3000): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval)
    }

    this.statsInterval = setInterval(async () => {
      const stats = await this.getAllConnectionStats()
      this.onStatsUpdate?.(stats)
    }, intervalMs)
  }

  stopStatsMonitoring(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval)
      this.statsInterval = null
    }
  }

  // Quality and Bandwidth Management
  async adaptQuality(peerId: string): Promise<void> {
    if (!this.settings.enableAdaptiveQuality) return

    const stats = await this.getConnectionStats(peerId)
    if (!stats) return

    const peerConnection = this.peerConnections.get(peerId)
    if (!peerConnection) return

    // Adjust video quality based on connection stats
    if (stats.quality === 'low') {
      // Reduce video quality
      const sender = peerConnection.connection.getSenders().find(s => s.track?.kind === 'video')
      if (sender && sender.track) {
        const constraints = sender.track.getConstraints()
        sender.track.applyConstraints({
          ...constraints,
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 24 }
        })
      }
    } else if (stats.quality === 'high') {
      // Increase video quality
      const sender = peerConnection.connection.getSenders().find(s => s.track?.kind === 'video')
      if (sender && sender.track) {
        const constraints = sender.track.getConstraints()
        sender.track.applyConstraints({
          ...constraints,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        })
      }
    }
  }

  // Settings Management
  updateSettings(newSettings: Partial<WebRTCSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
  }

  getSettings(): WebRTCSettings {
    return { ...this.settings }
  }

  // Private Methods
  private setupPeerConnectionEvents(peerId: string, connection: RTCPeerConnection): void {
    // ICE candidate events
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate?.(peerId, event.candidate)
      }
    }

    // Connection state changes
    connection.onconnectionstatechange = () => {
      const peerConnection = this.peerConnections.get(peerId)
      if (!peerConnection) return

      const wasConnected = peerConnection.isConnected
      peerConnection.isConnected = connection.connectionState === 'connected'
      peerConnection.isConnecting = connection.connectionState === 'connecting'

      if (peerConnection.isConnected && !wasConnected) {
        this.onPeerConnected?.(peerId)
        this.reconnectionAttempts.delete(peerId)
      } else if (!peerConnection.isConnected && wasConnected) {
        this.onPeerDisconnected?.(peerId)
        this.handleReconnection(peerId)
      }
    }

    // ICE connection state changes
    connection.oniceconnectionstatechange = () => {
      if (connection.iceConnectionState === 'failed') {
        this.handleReconnection(peerId)
      }
    }

    // Track events
    connection.ontrack = (event) => {
      const peerConnection = this.peerConnections.get(peerId)
      if (peerConnection) {
        peerConnection.remoteStream = event.streams[0]
        this.onRemoteStream?.(peerId, event.streams[0])
      }
    }

    // Data channel events
    connection.ondatachannel = (event) => {
      this.onDataChannel?.(peerId, event.channel)
    }
  }

  private async handleReconnection(peerId: string): Promise<void> {
    const attempts = this.reconnectionAttempts.get(peerId) || 0
    
    if (attempts >= this.maxReconnectionAttempts) {
      console.warn(`Max reconnection attempts reached for peer ${peerId}`)
      return
    }

    this.reconnectionAttempts.set(peerId, attempts + 1)
    this.onReconnectionAttempt?.(peerId, attempts + 1)

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000)
    
    setTimeout(async () => {
      try {
        const peerConnection = this.peerConnections.get(peerId)
        if (peerConnection && peerConnection.connection.connectionState === 'failed') {
          // Attempt to restart ICE
          await peerConnection.connection.restartIce()
        }
      } catch (error) {
        console.error(`Reconnection attempt failed for peer ${peerId}:`, error)
      }
    }, delay)
  }

  // Cleanup
  cleanup(): void {
    this.stopStatsMonitoring()
    this.closeAllConnections()
    this.stopLocalStream()
    this.peerConnections.clear()
    this.reconnectionAttempts.clear()
  }
}

// Create singleton instance
export const webrtcService = new WebRTCService()

// Export types for external use
export type { PeerConnection, MediaConstraints }
