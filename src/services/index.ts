// Export all services
export { AuthService } from './authService'
export { MeetingService } from './meetingService'
export { SocketService, socketService } from './socketService'
export { WebRTCService, webrtcService } from './webrtcService'

// Export types
export type {
  Meeting,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  JoinMeetingRequest,
  JoinMeetingResponse,
  MeetingListResponse,
  MeetingFilters,
  EmployeeMeetingFilters,
  UpcomingMeetingsFilters,
  MeetingAttendanceResponse,
  RecordingStats
} from './meetingService'

export type { SocketEvents } from './socketService'
export type { PeerConnection, MediaConstraints } from './webrtcService'

// Export utilities
export * from '../utils/meetingUtils'
