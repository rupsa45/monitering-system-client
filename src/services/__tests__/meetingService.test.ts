import { MeetingService } from '../meetingService'
import { api } from '@/config/api'

// Mock the api module
jest.mock('@/config/api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

describe('MeetingService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Admin Methods', () => {
    it('should create a meeting', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Meeting created successfully',
          data: {
            id: '1',
            title: 'Test Meeting',
            type: 'BASIC',
            status: 'SCHEDULED'
          }
        }
      }

      ;(api.post as jest.Mock).mockResolvedValue(mockResponse)

      const meetingData = {
        title: 'Test Meeting',
        type: 'BASIC' as const,
        scheduledStart: '2024-01-15T10:00:00Z',
        scheduledEnd: '2024-01-15T11:00:00Z'
      }

      const result = await MeetingService.createMeeting(meetingData)

      expect(api.post).toHaveBeenCalledWith('/admin/meetings', meetingData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should get meetings with filters', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Meetings retrieved successfully',
          data: {
            meetings: [],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalMeetings: 0,
              limit: 20
            }
          }
        }
      }

      ;(api.get as jest.Mock).mockResolvedValue(mockResponse)

      const filters = { status: 'SCHEDULED', page: 1, limit: 20 }
      const result = await MeetingService.getMeetings(filters)

      expect(api.get).toHaveBeenCalledWith('/admin/meetings', { params: filters })
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('Employee Methods', () => {
    it('should get employee meetings', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Employee meetings retrieved successfully',
          data: {
            meetings: [],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalMeetings: 0,
              limit: 20
            }
          }
        }
      }

      ;(api.get as jest.Mock).mockResolvedValue(mockResponse)

      const filters = { status: 'SCHEDULED' }
      const result = await MeetingService.getMyMeetings(filters)

      expect(api.get).toHaveBeenCalledWith('/emp/meetings', { params: filters })
      expect(result).toEqual(mockResponse.data)
    })

    it('should join a meeting', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Joined meeting successfully',
          data: {
            meeting: {
              id: '1',
              title: 'Test Meeting',
              roomCode: 'ABC123'
            },
            accessToken: 'test-token',
            iceConfig: {
              iceServers: []
            }
          }
        }
      }

      ;(api.post as jest.Mock).mockResolvedValue(mockResponse)

      const joinData = { password: 'test123' }
      const result = await MeetingService.joinMeeting('ABC123', joinData)

      expect(api.post).toHaveBeenCalledWith('/emp/meetings/ABC123/join', joinData)
      expect(result).toEqual(mockResponse.data)
    })
  })

  describe('Utility Methods', () => {
    it('should format meeting duration correctly', () => {
      const startTime = '2024-01-15T10:00:00Z'
      const endTime = '2024-01-15T11:30:00Z'
      
      const duration = MeetingService.formatMeetingDuration(startTime, endTime)
      expect(duration).toBe('1h 30m')
    })

    it('should return ongoing for meetings without end time', () => {
      const startTime = '2024-01-15T10:00:00Z'
      
      const duration = MeetingService.formatMeetingDuration(startTime)
      expect(duration).toBe('Ongoing')
    })

    it('should get correct status color', () => {
      expect(MeetingService.getMeetingStatusColor('SCHEDULED')).toBe('bg-yellow-500 hover:bg-yellow-600')
      expect(MeetingService.getMeetingStatusColor('LIVE')).toBe('bg-red-500 hover:bg-red-600')
      expect(MeetingService.getMeetingStatusColor('ENDED')).toBe('bg-gray-500 hover:bg-gray-600')
      expect(MeetingService.getMeetingStatusColor('CANCELED')).toBe('bg-gray-400 hover:bg-gray-500')
    })

    it('should get correct type label', () => {
      expect(MeetingService.getMeetingTypeLabel('BASIC')).toBe('Basic')
      expect(MeetingService.getMeetingTypeLabel('NORMAL')).toBe('Normal')
      expect(MeetingService.getMeetingTypeLabel('LONG')).toBe('Long')
    })

    it('should check if meeting is joinable', () => {
      const scheduledMeeting = { status: 'SCHEDULED' as const }
      const liveMeeting = { status: 'LIVE' as const }
      const endedMeeting = { status: 'ENDED' as const }

      expect(MeetingService.isMeetingJoinable(scheduledMeeting)).toBe(true)
      expect(MeetingService.isMeetingJoinable(liveMeeting)).toBe(true)
      expect(MeetingService.isMeetingJoinable(endedMeeting)).toBe(false)
    })

    it('should check meeting permissions correctly', () => {
      const meeting = {
        host: { id: 'user1' },
        participants: [
          { id: 'user1', role: 'HOST' as const },
          { id: 'user2', role: 'PARTICIPANT' as const }
        ]
      }

      expect(MeetingService.isMeetingHost(meeting, 'user1')).toBe(true)
      expect(MeetingService.isMeetingHost(meeting, 'user2')).toBe(false)
      expect(MeetingService.isMeetingParticipant(meeting, 'user1')).toBe(true)
      expect(MeetingService.isMeetingParticipant(meeting, 'user2')).toBe(true)
      expect(MeetingService.isMeetingParticipant(meeting, 'user3')).toBe(false)
      expect(MeetingService.getParticipantRole(meeting, 'user1')).toBe('HOST')
      expect(MeetingService.getParticipantRole(meeting, 'user2')).toBe('PARTICIPANT')
      expect(MeetingService.getParticipantRole(meeting, 'user3')).toBe(null)
    })
  })
})





