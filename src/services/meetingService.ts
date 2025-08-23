import { api } from '@/config/api'
import { API_ENDPOINTS } from '@/config/api'

// Meeting Types
export interface Meeting {
  id: string
  roomCode: string
  title: string
  description?: string
  type: 'BASIC' | 'NORMAL' | 'LONG'
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELED'
  scheduledStart?: string
  scheduledEnd?: string
  actualStart?: string
  actualEnd?: string
  password?: string
  isPersistent?: boolean
  host: {
    id: string
    empName: string
    empEmail: string
    empTechnology?: string
  }
  participants: Array<{
    id: string
    empName: string
    empEmail: string
    empTechnology?: string
    role: 'HOST' | 'COHOST' | 'PARTICIPANT'
    joinedAt?: string
    leftAt?: string
    isBanned?: boolean
  }>
  recordings?: Array<{
    id: string
    fileName: string
    fileUrl: string
    fileSize: number
    duration: number
    createdAt: string
    createdBy: {
      id: string
      empName: string
      empEmail: string
    }
  }>
  events?: Array<{
    id: string
    type: string
    description: string
    at: string
    employee: {
      id: string
      empName: string
      empEmail: string
    }
  }>
  createdAt: string
  updatedAt: string
}

export interface CreateMeetingRequest {
  title: string
  description?: string
  type: 'BASIC' | 'NORMAL' | 'LONG'
  scheduledStart: string
  scheduledEnd: string
  password?: string
  isPersistent?: boolean
  participants?: string[]
}

export interface UpdateMeetingRequest {
  title?: string
  description?: string
  type?: 'BASIC' | 'NORMAL' | 'LONG'
  scheduledStart?: string
  scheduledEnd?: string
  password?: string
  isPersistent?: boolean
}

export interface JoinMeetingRequest {
  password?: string
  timeSheetId?: string
}

export interface JoinMeetingResponse {
  success: boolean
  message: string
  data: {
    meeting: Meeting
    accessToken: string
    iceConfig: {
      iceServers: Array<{
        urls: string[]
        username?: string
        credential?: string
      }>
    }
  }
}

export interface MeetingListResponse {
  success: boolean
  message: string
  data: {
    meetings: Meeting[]
    pagination: {
      currentPage: number
      totalPages: number
      totalMeetings: number
      limit: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

export interface MeetingFilters {
  hostId?: string
  type?: 'BASIC' | 'NORMAL' | 'LONG'
  status?: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELED'
  startDate?: string
  endDate?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface EmployeeMeetingFilters {
  type?: 'BASIC' | 'NORMAL' | 'LONG'
  status?: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELED'
  page?: number
  limit?: number
}

export interface UpcomingMeetingsFilters {
  minutesAhead?: number
}

export interface MeetingAttendanceResponse {
  success: boolean
  message: string
  data: {
    meeting: Meeting
    participants: Array<{
      id: string
      empName: string
      empEmail: string
      empTechnology?: string
      role: 'HOST' | 'COHOST' | 'PARTICIPANT'
      joinedAt?: string
      leftAt?: string
      duration?: number
      durationMinutes?: number
      timesheet?: {
        id: string
        clockIn: string
        clockOut?: string
        hoursLoggedIn?: number
      }
    }>
    summary: {
      totalParticipants: number
      totalDuration: number
      averageDuration: number
      attendanceRate: number
    }
  }
}

export interface RecordingStats {
  success: boolean
  message: string
  data: {
    totalRecordings: number
    totalDuration: number
    averageDuration: number
    totalFileSize: number
    recordingsByDate: Array<{
      date: string
      count: number
      totalDuration: number
    }>
  }
}

export class MeetingService {
  // Admin Meeting Methods
  static async createMeeting(data: CreateMeetingRequest): Promise<{ success: boolean; message: string; data: Meeting }> {
    const response = await api.post(API_ENDPOINTS.meetings.admin.create, data)
    return response.data
  }

  static async getMeetings(filters?: MeetingFilters): Promise<MeetingListResponse> {
    const response = await api.get(API_ENDPOINTS.meetings.admin.list, { params: filters })
    return response.data
  }

  static async getMeetingById(id: string): Promise<{ success: boolean; message: string; data: Meeting }> {
    const response = await api.get(`${API_ENDPOINTS.meetings.admin.getById}/${id}`)
    return response.data
  }

  static async updateMeeting(id: string, data: UpdateMeetingRequest): Promise<{ success: boolean; message: string; data: Meeting }> {
    const response = await api.patch(`${API_ENDPOINTS.meetings.admin.update}/${id}`, data)
    return response.data
  }

  static async startMeeting(id: string): Promise<{ success: boolean; message: string; data: Meeting }> {
    const response = await api.post(`${API_ENDPOINTS.meetings.admin.start}/${id}/start`)
    return response.data
  }

  static async endMeeting(id: string): Promise<{ success: boolean; message: string; data: Meeting }> {
    const response = await api.post(`${API_ENDPOINTS.meetings.admin.end}/${id}/end`)
    return response.data
  }

  static async cancelMeeting(id: string): Promise<{ success: boolean; message: string; data: Meeting }> {
    const response = await api.post(`${API_ENDPOINTS.meetings.admin.cancel}/${id}/cancel`)
    return response.data
  }

  static async kickParticipant(meetingId: string, empId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`${API_ENDPOINTS.meetings.admin.kick}/${meetingId}/kick`, { empId })
    return response.data
  }

  static async banParticipant(meetingId: string, empId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`${API_ENDPOINTS.meetings.admin.ban}/${meetingId}/ban`, { empId })
    return response.data
  }

  static async sendInvites(meetingId: string, empIds: string[], message?: string): Promise<{ success: boolean; message: string; data: unknown }> {
    const response = await api.post(`${API_ENDPOINTS.meetings.admin.remind}/${meetingId}/remind`, { empIds, message })
    return response.data
  }

  static async getAttendance(meetingId: string): Promise<MeetingAttendanceResponse> {
    const response = await api.get(`${API_ENDPOINTS.meetings.admin.attendance}/${meetingId}/attendance`)
    return response.data
  }

  static async sendReminders(minutesAhead: number = 15): Promise<{ success: boolean; message: string; data: unknown }> {
    const response = await api.post(API_ENDPOINTS.meetings.admin.reminders, { minutesAhead })
    return response.data
  }

  // Employee Meeting Methods
  static async createEmployeeMeeting(data: CreateMeetingRequest): Promise<{ success: boolean; message: string; data: Meeting }> {
    const response = await api.post(API_ENDPOINTS.meetings.employee.create, data)
    return response.data
  }

  static async getMyMeetings(filters?: EmployeeMeetingFilters): Promise<MeetingListResponse> {
    const response = await api.get(API_ENDPOINTS.meetings.employee.list, { params: filters })
    return response.data
  }

  static async getUpcomingMeetings(filters?: UpcomingMeetingsFilters): Promise<{ success: boolean; message: string; data: Meeting[] }> {
    const response = await api.get(API_ENDPOINTS.meetings.employee.upcoming, { params: filters })
    return response.data
  }

  static async getMeetingByRoomCode(roomCode: string): Promise<{ success: boolean; message: string; data: Meeting }> {
    const response = await api.get(`${API_ENDPOINTS.meetings.employee.getByRoomCode}/${roomCode}`)
    return response.data
  }

  static async joinMeeting(roomCode: string, data?: JoinMeetingRequest): Promise<JoinMeetingResponse> {
    const response = await api.post(`${API_ENDPOINTS.meetings.employee.join}/${roomCode}/join`, data || {})
    return response.data
  }

  static async leaveMeeting(roomCode: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`${API_ENDPOINTS.meetings.employee.leave}/${roomCode}/leave`)
    return response.data
  }

  static async getAccessToken(roomCode: string): Promise<{ success: boolean; message: string; data: { accessToken: string; iceConfig: unknown } }> {
    const response = await api.post(`${API_ENDPOINTS.meetings.employee.accessToken}/${roomCode}/access-token`)
    return response.data
  }

  // Recording Methods
  static async uploadRecording(meetingId: string, file: File): Promise<{ success: boolean; message: string; data: unknown }> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post(`${API_ENDPOINTS.meetings.recordings.upload}/${meetingId}/recordings`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }

  static async getRecordings(meetingId: string): Promise<{ success: boolean; message: string; data: unknown[] }> {
    const response = await api.get(`${API_ENDPOINTS.meetings.recordings.list}/${meetingId}/recordings`)
    return response.data
  }

  static async deleteRecording(meetingId: string, recordingId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`${API_ENDPOINTS.meetings.recordings.delete}/${meetingId}/recordings/${recordingId}`)
    return response.data
  }

  static async getRecordingStats(meetingId: string): Promise<RecordingStats> {
    const response = await api.get(`${API_ENDPOINTS.meetings.recordings.stats}/${meetingId}/recordings/stats`)
    return response.data
  }

  // Utility Methods
  static formatMeetingDuration(startTime: string, endTime?: string): string {
    if (!endTime) return 'Ongoing'
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    const duration = end.getTime() - start.getTime()
    
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  static getMeetingStatusColor(status: Meeting['status']): string {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'LIVE':
        return 'bg-red-500 hover:bg-red-600'
      case 'ENDED':
        return 'bg-gray-500 hover:bg-gray-600'
      case 'CANCELED':
        return 'bg-gray-400 hover:bg-gray-500'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  static getMeetingTypeLabel(type: Meeting['type']): string {
    switch (type) {
      case 'BASIC':
        return 'Basic'
      case 'NORMAL':
        return 'Normal'
      case 'LONG':
        return 'Long'
      default:
        return type
    }
  }

  static isMeetingJoinable(meeting: Meeting): boolean {
    return meeting.status === 'SCHEDULED' || meeting.status === 'LIVE'
  }

  static isMeetingEditable(meeting: Meeting, userRole: string, userId: string): boolean {
    if (userRole === 'admin') return true
    return meeting.host.id === userId && meeting.status === 'SCHEDULED'
  }

  static isMeetingHost(meeting: Meeting, userId: string): boolean {
    return meeting.host.id === userId
  }

  static isMeetingParticipant(meeting: Meeting, userId: string): boolean {
    return meeting.participants.some(p => p.id === userId)
  }

  static getParticipantRole(meeting: Meeting, userId: string): 'HOST' | 'COHOST' | 'PARTICIPANT' | null {
    const participant = meeting.participants.find(p => p.id === userId)
    return participant?.role || null
  }
}
