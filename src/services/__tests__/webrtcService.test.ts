import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import { WebRTCService, webrtcService } from '../webrtcService'

// Mock WebRTC APIs
const mockGetUserMedia = vi.fn()
const mockGetDisplayMedia = vi.fn()
const mockEnumerateDevices = vi.fn()

// Mock RTCPeerConnection
const mockRTCPeerConnection = vi.fn()
const mockAddTrack = vi.fn()
const mockCreateOffer = vi.fn()
const mockCreateAnswer = vi.fn()
const mockSetLocalDescription = vi.fn()
const mockSetRemoteDescription = vi.fn()
const mockAddIceCandidate = vi.fn()
const mockGetStats = vi.fn()
const mockClose = vi.fn()
const mockGetSenders = vi.fn()

// Mock MediaStream
const mockMediaStream = {
  getTracks: vi.fn(() => [
    { kind: 'video', enabled: true, stop: vi.fn(), getSettings: vi.fn(() => ({ deviceId: 'test-device' })) },
    { kind: 'audio', enabled: true, stop: vi.fn() }
  ]),
  getVideoTracks: vi.fn(() => [{ enabled: true, stop: vi.fn(), getSettings: vi.fn(() => ({ deviceId: 'test-device' })) }]),
  getAudioTracks: vi.fn(() => [{ enabled: true, stop: vi.fn() }]),
  removeTrack: vi.fn(),
  addTrack: vi.fn()
}

// Mock RTCSessionDescription
const mockRTCSessionDescription = {
  type: 'offer',
  sdp: 'test-sdp'
}

describe('WebRTCService', () => {
  let service: WebRTCService

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock global WebRTC APIs
    global.navigator.mediaDevices = {
      getUserMedia: mockGetUserMedia,
      getDisplayMedia: mockGetDisplayMedia,
      enumerateDevices: mockEnumerateDevices
    } as any

    // Mock RTCPeerConnection
    global.RTCPeerConnection = mockRTCPeerConnection as any
    mockRTCPeerConnection.mockImplementation(() => ({
      addTrack: mockAddTrack,
      createOffer: mockCreateOffer,
      createAnswer: mockCreateAnswer,
      setLocalDescription: mockSetLocalDescription,
      setRemoteDescription: mockSetRemoteDescription,
      addIceCandidate: mockAddIceCandidate,
      getStats: mockGetStats,
      close: mockClose,
      getSenders: mockGetSenders,
      onicecandidate: null,
      onconnectionstatechange: null,
      oniceconnectionstatechange: null,
      ontrack: null,
      ondatachannel: null
    }))

    // Mock MediaStream
    global.MediaStream = vi.fn(() => mockMediaStream) as any

    // Create fresh service instance
    service = new WebRTCService()
  })

  afterEach(() => {
    service.cleanup()
  })

  describe('Local Media Stream Management', () => {
    it('should initialize local stream successfully', async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream)

      const result = await service.initializeLocalStream()

      expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true, audio: true })
      expect(result).toBe(mockMediaStream)
      expect(service.getLocalStream()).toBe(mockMediaStream)
    })

    it('should handle getUserMedia errors', async () => {
      const error = new Error('Permission denied')
      mockGetUserMedia.mockRejectedValue(error)

      await expect(service.initializeLocalStream()).rejects.toThrow('Failed to access camera/microphone')
    })

    it('should stop local stream', async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream)
      await service.initializeLocalStream()

      await service.stopLocalStream()

      expect(mockMediaStream.getTracks).toHaveBeenCalled()
      expect(service.getLocalStream()).toBeNull()
    })
  })

  describe('Peer Connection Management', () => {
    beforeEach(async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream)
      await service.initializeLocalStream()
    })

    it('should create peer connection', () => {
      const peerId = 'test-peer'
      const connection = service.createPeerConnection(peerId)

      expect(mockRTCPeerConnection).toHaveBeenCalled()
      expect(mockAddTrack).toHaveBeenCalled()
      expect(connection).toBeDefined()
      expect(service.getPeerConnection(peerId)).toBe(connection)
    })

    it('should close peer connection', async () => {
      const peerId = 'test-peer'
      service.createPeerConnection(peerId)

      await service.closePeerConnection(peerId)

      expect(mockClose).toHaveBeenCalled()
      expect(service.getPeerConnection(peerId)).toBeNull()
    })

    it('should close all connections', async () => {
      service.createPeerConnection('peer1')
      service.createPeerConnection('peer2')

      await service.closeAllConnections()

      expect(mockClose).toHaveBeenCalledTimes(2)
      expect(service.getTotalConnections()).toBe(0)
    })
  })

  describe('WebRTC Signaling', () => {
    beforeEach(async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream)
      await service.initializeLocalStream()
    })

    it('should create offer', async () => {
      const peerId = 'test-peer'
      service.createPeerConnection(peerId)
      mockCreateOffer.mockResolvedValue(mockRTCSessionDescription)
      mockSetLocalDescription.mockResolvedValue(undefined)

      const offer = await service.createOffer(peerId)

      expect(mockCreateOffer).toHaveBeenCalled()
      expect(mockSetLocalDescription).toHaveBeenCalledWith(mockRTCSessionDescription)
      expect(offer).toBe(mockRTCSessionDescription)
    })

    it('should create answer', async () => {
      const peerId = 'test-peer'
      service.createPeerConnection(peerId)
      mockCreateAnswer.mockResolvedValue(mockRTCSessionDescription)
      mockSetLocalDescription.mockResolvedValue(undefined)

      const answer = await service.createAnswer(peerId)

      expect(mockCreateAnswer).toHaveBeenCalled()
      expect(mockSetLocalDescription).toHaveBeenCalledWith(mockRTCSessionDescription)
      expect(answer).toBe(mockRTCSessionDescription)
    })

    it('should set remote description', async () => {
      const peerId = 'test-peer'
      service.createPeerConnection(peerId)
      mockSetRemoteDescription.mockResolvedValue(undefined)

      await service.setRemoteDescription(peerId, mockRTCSessionDescription)

      expect(mockSetRemoteDescription).toHaveBeenCalledWith(mockRTCSessionDescription)
    })

    it('should add ICE candidate', async () => {
      const peerId = 'test-peer'
      service.createPeerConnection(peerId)
      const candidate = { candidate: 'test-candidate' }
      mockAddIceCandidate.mockResolvedValue(undefined)

      await service.addIceCandidate(peerId, candidate)

      expect(mockAddIceCandidate).toHaveBeenCalledWith(candidate)
    })

    it('should throw error for non-existent peer', async () => {
      await expect(service.createOffer('non-existent')).rejects.toThrow('Peer connection not found')
      await expect(service.createAnswer('non-existent')).rejects.toThrow('Peer connection not found')
      await expect(service.setRemoteDescription('non-existent', mockRTCSessionDescription)).rejects.toThrow('Peer connection not found')
      await expect(service.addIceCandidate('non-existent', {})).rejects.toThrow('Peer connection not found')
    })
  })

  describe('Media Control', () => {
    beforeEach(async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream)
      await service.initializeLocalStream()
    })

    it('should toggle video', async () => {
      const videoTrack = { enabled: true }
      mockMediaStream.getVideoTracks.mockReturnValue([videoTrack])

      await service.toggleVideo(false)

      expect(videoTrack.enabled).toBe(false)
    })

    it('should toggle audio', async () => {
      const audioTrack = { enabled: true }
      mockMediaStream.getAudioTracks.mockReturnValue([audioTrack])

      await service.toggleAudio(false)

      expect(audioTrack.enabled).toBe(false)
    })

    it('should switch camera', async () => {
      const videoTrack = { getSettings: vi.fn(() => ({ deviceId: 'current-device' })), stop: vi.fn() }
      mockMediaStream.getVideoTracks.mockReturnValue([videoTrack])
      mockEnumerateDevices.mockResolvedValue([
        { kind: 'videoinput', deviceId: 'device1' },
        { kind: 'videoinput', deviceId: 'device2' }
      ])
      mockGetUserMedia.mockResolvedValue({
        getVideoTracks: vi.fn(() => [{ replaceTrack: vi.fn() }])
      })

      await service.switchCamera()

      expect(mockEnumerateDevices).toHaveBeenCalled()
      expect(mockGetUserMedia).toHaveBeenCalled()
    })
  })

  describe('Screen Sharing', () => {
    beforeEach(async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream)
      await service.initializeLocalStream()
    })

    it('should start screen sharing', async () => {
      const screenStream = { getVideoTracks: vi.fn(() => [{ replaceTrack: vi.fn() }]) }
      mockGetDisplayMedia.mockResolvedValue(screenStream)
      mockGetSenders.mockReturnValue([{ track: { kind: 'video' }, replaceTrack: vi.fn() }])

      const result = await service.startScreenShare()

      expect(mockGetDisplayMedia).toHaveBeenCalledWith({ video: true, audio: true })
      expect(result).toBe(screenStream)
    })

    it('should stop screen sharing', async () => {
      const videoTrack = { stop: vi.fn() }
      mockMediaStream.getVideoTracks.mockReturnValue([videoTrack])
      mockGetUserMedia.mockResolvedValue({
        getVideoTracks: vi.fn(() => [{ replaceTrack: vi.fn() }])
      })
      mockGetSenders.mockReturnValue([{ track: { kind: 'video' }, replaceTrack: vi.fn() }])

      await service.stopScreenShare()

      expect(mockGetUserMedia).toHaveBeenCalled()
      expect(videoTrack.stop).toHaveBeenCalled()
    })
  })

  describe('Connection Status', () => {
    beforeEach(async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream)
      await service.initializeLocalStream()
    })

    it('should track connection status', () => {
      const peerId = 'test-peer'
      service.createPeerConnection(peerId)

      expect(service.isPeerConnected(peerId)).toBe(false)
      expect(service.isPeerConnecting(peerId)).toBe(false)
      expect(service.getConnectedPeers()).toEqual([])
      expect(service.getTotalConnections()).toBe(1)
    })

    it('should get remote streams', () => {
      const peerId = 'test-peer'
      service.createPeerConnection(peerId)

      expect(service.getRemoteStream(peerId)).toBeNull()
      expect(service.getAllRemoteStreams()).toEqual([])
    })
  })

  describe('Statistics and Monitoring', () => {
    beforeEach(async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream)
      await service.initializeLocalStream()
    })

    it('should get connection stats', async () => {
      const peerId = 'test-peer'
      service.createPeerConnection(peerId)
      const mockStats = new Map()
      mockGetStats.mockResolvedValue(mockStats)

      const stats = await service.getConnectionStats(peerId)

      expect(mockGetStats).toHaveBeenCalled()
      expect(stats).toBeDefined()
    })

    it('should start and stop stats monitoring', () => {
      const onStatsUpdate = vi.fn()
      service.onStatsUpdate = onStatsUpdate

      service.startStatsMonitoring(1000)
      expect(service['statsInterval']).toBeDefined()

      service.stopStatsMonitoring()
      expect(service['statsInterval']).toBeNull()
    })
  })

  describe('Settings Management', () => {
    it('should update and get settings', () => {
      const newSettings = {
        videoQuality: 'medium' as const,
        audioQuality: 'low' as const,
        bandwidthLimit: 1000000,
        enableAdaptiveQuality: false,
        enableBandwidthOptimization: false
      }

      service.updateSettings(newSettings)
      const currentSettings = service.getSettings()

      expect(currentSettings).toEqual(newSettings)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup all resources', async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream)
      await service.initializeLocalStream()
      service.createPeerConnection('test-peer')

      service.cleanup()

      expect(service.getLocalStream()).toBeNull()
      expect(service.getTotalConnections()).toBe(0)
    })
  })

  describe('Event Callbacks', () => {
    it('should handle event callbacks', () => {
      const onIceCandidate = vi.fn()
      const onPeerConnected = vi.fn()
      const onPeerDisconnected = vi.fn()
      const onRemoteStream = vi.fn()
      const onDataChannel = vi.fn()
      const onStatsUpdate = vi.fn()
      const onReconnectionAttempt = vi.fn()

      service.onIceCandidate = onIceCandidate
      service.onPeerConnected = onPeerConnected
      service.onPeerDisconnected = onPeerDisconnected
      service.onRemoteStream = onRemoteStream
      service.onDataChannel = onDataChannel
      service.onStatsUpdate = onStatsUpdate
      service.onReconnectionAttempt = onReconnectionAttempt

      expect(service.onIceCandidate).toBe(onIceCandidate)
      expect(service.onPeerConnected).toBe(onPeerConnected)
      expect(service.onPeerDisconnected).toBe(onPeerDisconnected)
      expect(service.onRemoteStream).toBe(onRemoteStream)
      expect(service.onDataChannel).toBe(onDataChannel)
      expect(service.onStatsUpdate).toBe(onStatsUpdate)
      expect(service.onReconnectionAttempt).toBe(onReconnectionAttempt)
    })
  })
})




