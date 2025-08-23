import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { MeetingService, Meeting, CreateMeetingRequest, UpdateMeetingRequest, MeetingFilters, EmployeeMeetingFilters, JoinMeetingRequest } from '@/services/meetingService'

// Meeting State Interface
export interface MeetingState {
  // Data
  meetings: Meeting[]
  currentMeeting: Meeting | null
  upcomingMeetings: Meeting[]
  recordings: unknown[]
  
  // Loading States
  loading: boolean
  creating: boolean
  updating: boolean
  joining: boolean
  leaving: boolean
  uploading: boolean
  
  // Error States
  error: string | null
  
  // UI State
  filters: MeetingFilters
  viewMode: 'grid' | 'list'
  selectedMeetings: string[]
  showCreateModal: boolean
  showEditModal: boolean
  showJoinModal: boolean
  showRecordingsModal: boolean
  
  // Pagination
  pagination: {
    currentPage: number
    totalPages: number
    totalMeetings: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Meeting Actions Interface
export interface MeetingActions {
  // Data Fetching
  fetchMeetings: (filters?: MeetingFilters) => Promise<void>
  fetchMyMeetings: (filters?: EmployeeMeetingFilters) => Promise<void>
  fetchUpcomingMeetings: () => Promise<void>
  fetchMeetingById: (id: string) => Promise<void>
  fetchMeetingByRoomCode: (roomCode: string) => Promise<void>
  fetchRecordings: (meetingId: string) => Promise<void>
  
  // Meeting Management
  createMeeting: (data: CreateMeetingRequest) => Promise<boolean>
  updateMeeting: (id: string, data: UpdateMeetingRequest) => Promise<boolean>
  deleteMeeting: (id: string) => Promise<boolean>
  startMeeting: (id: string) => Promise<boolean>
  endMeeting: (id: string) => Promise<boolean>
  cancelMeeting: (id: string) => Promise<boolean>
  
                // Meeting Participation
              joinMeeting: (roomCode: string, data: JoinMeetingRequest) => Promise<boolean>
  leaveMeeting: (roomCode: string) => Promise<boolean>
  getAccessToken: (roomCode: string) => Promise<string | null>
  
  // Host Controls
  kickParticipant: (meetingId: string, empId: string) => Promise<boolean>
  banParticipant: (meetingId: string, empId: string) => Promise<boolean>
  sendInvites: (meetingId: string, empIds: string[], message?: string) => Promise<boolean>
  
  // Recording Management
  uploadRecording: (meetingId: string, file: File) => Promise<boolean>
  deleteRecording: (meetingId: string, recordingId: string) => Promise<boolean>
  
  // UI Actions
  setFilters: (filters: Partial<MeetingFilters>) => void
  setViewMode: (mode: 'grid' | 'list') => void
  selectMeeting: (meetingId: string) => void
  deselectMeeting: (meetingId: string) => void
  selectAllMeetings: () => void
  deselectAllMeetings: () => void
  toggleCreateModal: (show?: boolean) => void
  toggleEditModal: (show?: boolean) => void
  toggleJoinModal: (show?: boolean) => void
  toggleRecordingsModal: (show?: boolean) => void
  
  // State Management
  setCurrentMeeting: (meeting: Meeting | null) => void
  clearError: () => void
  reset: () => void
}

// Combined Store Type
export type MeetingStore = MeetingState & MeetingActions

// Initial State
const initialState: MeetingState = {
  meetings: [],
  currentMeeting: null,
  upcomingMeetings: [],
  recordings: [],
  
  loading: false,
  creating: false,
  updating: false,
  joining: false,
  leaving: false,
  uploading: false,
  
  error: null,
  
  filters: {
    page: 1,
    limit: 20
  },
  viewMode: 'grid',
  selectedMeetings: [],
  showCreateModal: false,
  showEditModal: false,
  showJoinModal: false,
  showRecordingsModal: false,
  
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalMeetings: 0,
    limit: 20,
    hasNext: false,
    hasPrev: false
  }
}

// Create the store
export const useMeetingStore = create<MeetingStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Data Fetching Actions
      fetchMeetings: async (filters?: MeetingFilters) => {
        set({ loading: true, error: null })
        try {
          const response = await MeetingService.getMeetings(filters || get().filters)
          if (response.success) {
            set({
              meetings: response.data.meetings,
              pagination: response.data.pagination,
              loading: false
            })
          } else {
            set({ error: response.message, loading: false })
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch meetings',
            loading: false 
          })
        }
      },

      fetchMyMeetings: async (filters?: EmployeeMeetingFilters) => {
        set({ loading: true, error: null })
        try {
          const response = await MeetingService.getMyMeetings(filters)
          if (response.success) {
            set({
              meetings: response.data.meetings,
              pagination: response.data.pagination,
              loading: false
            })
          } else {
            set({ error: response.message, loading: false })
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch meetings',
            loading: false 
          })
        }
      },

      fetchUpcomingMeetings: async () => {
        try {
          const response = await MeetingService.getUpcomingMeetings()
          if (response.success) {
            set({ upcomingMeetings: response.data })
          } else {
            set({ error: response.message })
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch upcoming meetings'
          })
        }
      },

      fetchMeetingById: async (id: string) => {
        set({ loading: true, error: null })
        try {
          const response = await MeetingService.getMeetingById(id)
          if (response.success) {
            set({
              currentMeeting: response.data,
              loading: false
            })
          } else {
            set({ error: response.message, loading: false })
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch meeting',
            loading: false 
          })
        }
      },

      fetchMeetingByRoomCode: async (roomCode: string) => {
        set({ loading: true, error: null })
        try {
          const response = await MeetingService.getMeetingByRoomCode(roomCode)
          if (response.success) {
            set({
              currentMeeting: response.data,
              loading: false
            })
          } else {
            set({ error: response.message, loading: false })
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch meeting',
            loading: false 
          })
        }
      },

      fetchRecordings: async (meetingId: string) => {
        try {
          const response = await MeetingService.getRecordings(meetingId)
          if (response.success) {
            set({ recordings: response.data })
          } else {
            set({ error: response.message })
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch recordings'
          })
        }
      },

      // Meeting Management Actions
      createMeeting: async (data: CreateMeetingRequest) => {
        set({ creating: true, error: null })
        try {
          const response = await MeetingService.createMeeting(data)
          if (response.success) {
            set({ 
              meetings: [response.data, ...get().meetings],
              creating: false,
              showCreateModal: false
            })
            return true
          } else {
            set({ error: response.message, creating: false })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create meeting',
            creating: false 
          })
          return false
        }
      },

      updateMeeting: async (id: string, data: UpdateMeetingRequest) => {
        set({ updating: true, error: null })
        try {
          const response = await MeetingService.updateMeeting(id, data)
          if (response.success) {
            const updatedMeetings = get().meetings.map(meeting =>
              meeting.id === id ? response.data : meeting
            )
            set({ 
              meetings: updatedMeetings,
              currentMeeting: get().currentMeeting?.id === id ? response.data : get().currentMeeting,
              updating: false,
              showEditModal: false
            })
            return true
          } else {
            set({ error: response.message, updating: false })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update meeting',
            updating: false 
          })
          return false
        }
      },

      deleteMeeting: async (id: string) => {
        try {
          const response = await MeetingService.cancelMeeting(id)
          if (response.success) {
            const filteredMeetings = get().meetings.filter(meeting => meeting.id !== id)
            set({ meetings: filteredMeetings })
            return true
          } else {
            set({ error: response.message })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete meeting'
          })
          return false
        }
      },

      startMeeting: async (id: string) => {
        try {
          const response = await MeetingService.startMeeting(id)
          if (response.success) {
            const updatedMeetings = get().meetings.map(meeting =>
              meeting.id === id ? response.data : meeting
            )
            set({ meetings: updatedMeetings })
            return true
          } else {
            set({ error: response.message })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to start meeting'
          })
          return false
        }
      },

      endMeeting: async (id: string) => {
        try {
          const response = await MeetingService.endMeeting(id)
          if (response.success) {
            const updatedMeetings = get().meetings.map(meeting =>
              meeting.id === id ? response.data : meeting
            )
            set({ meetings: updatedMeetings })
            return true
          } else {
            set({ error: response.message })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to end meeting'
          })
          return false
        }
      },

      cancelMeeting: async (id: string) => {
        try {
          const response = await MeetingService.cancelMeeting(id)
          if (response.success) {
            const updatedMeetings = get().meetings.map(meeting =>
              meeting.id === id ? response.data : meeting
            )
            set({ meetings: updatedMeetings })
            return true
          } else {
            set({ error: response.message })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to cancel meeting'
          })
          return false
        }
      },

      // Meeting Participation Actions
      joinMeeting: async (roomCode: string, data: JoinMeetingRequest) => {
        set({ joining: true, error: null })
        try {
          const response = await MeetingService.joinMeeting(roomCode, data)
          if (response.success) {
            set({ 
              currentMeeting: response.data.meeting,
              joining: false,
              showJoinModal: false
            })
            return true
          } else {
            set({ error: response.message, joining: false })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to join meeting',
            joining: false 
          })
          return false
        }
      },

      leaveMeeting: async (roomCode: string) => {
        set({ leaving: true, error: null })
        try {
          const response = await MeetingService.leaveMeeting(roomCode)
          if (response.success) {
            set({ 
              currentMeeting: null,
              leaving: false
            })
            return true
          } else {
            set({ error: response.message, leaving: false })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to leave meeting',
            leaving: false 
          })
          return false
        }
      },

      getAccessToken: async (roomCode: string) => {
        try {
          const response = await MeetingService.getAccessToken(roomCode)
          if (response.success) {
            return response.data.accessToken
          } else {
            set({ error: response.message })
            return null
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to get access token'
          })
          return null
        }
      },

      // Host Control Actions
      kickParticipant: async (meetingId: string, empId: string) => {
        try {
          const response = await MeetingService.kickParticipant(meetingId, empId)
          if (response.success) {
            return true
          } else {
            set({ error: response.message })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to kick participant'
          })
          return false
        }
      },

      banParticipant: async (meetingId: string, empId: string) => {
        try {
          const response = await MeetingService.banParticipant(meetingId, empId)
          if (response.success) {
            return true
          } else {
            set({ error: response.message })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to ban participant'
          })
          return false
        }
      },

      sendInvites: async (meetingId: string, empIds: string[], message?: string) => {
        try {
          const response = await MeetingService.sendInvites(meetingId, empIds, message)
          if (response.success) {
            return true
          } else {
            set({ error: response.message })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to send invites'
          })
          return false
        }
      },

      // Recording Management Actions
      uploadRecording: async (meetingId: string, file: File) => {
        set({ uploading: true, error: null })
        try {
          const response = await MeetingService.uploadRecording(meetingId, file)
          if (response.success) {
            set({ uploading: false })
            // Refresh recordings
            get().fetchRecordings(meetingId)
            return true
          } else {
            set({ error: response.message, uploading: false })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to upload recording',
            uploading: false 
          })
          return false
        }
      },

      deleteRecording: async (meetingId: string, recordingId: string) => {
        try {
          const response = await MeetingService.deleteRecording(meetingId, recordingId)
          if (response.success) {
            const filteredRecordings = get().recordings.filter(recording => recording.id !== recordingId)
            set({ recordings: filteredRecordings })
            return true
          } else {
            set({ error: response.message })
            return false
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete recording'
          })
          return false
        }
      },

      // UI Actions
      setFilters: (filters: Partial<MeetingFilters>) => {
        set(state => ({
          filters: { ...state.filters, ...filters }
        }))
      },

      setViewMode: (mode: 'grid' | 'list') => {
        set({ viewMode: mode })
      },

      selectMeeting: (meetingId: string) => {
        set(state => ({
          selectedMeetings: [...state.selectedMeetings, meetingId]
        }))
      },

      deselectMeeting: (meetingId: string) => {
        set(state => ({
          selectedMeetings: state.selectedMeetings.filter(id => id !== meetingId)
        }))
      },

      selectAllMeetings: () => {
        set(state => ({
          selectedMeetings: state.meetings.map(meeting => meeting.id)
        }))
      },

      deselectAllMeetings: () => {
        set({ selectedMeetings: [] })
      },

      toggleCreateModal: (show?: boolean) => {
        set(state => ({
          showCreateModal: show !== undefined ? show : !state.showCreateModal
        }))
      },

      toggleEditModal: (show?: boolean) => {
        set(state => ({
          showEditModal: show !== undefined ? show : !state.showEditModal
        }))
      },

      toggleJoinModal: (show?: boolean) => {
        set(state => ({
          showJoinModal: show !== undefined ? show : !state.showJoinModal
        }))
      },

      toggleRecordingsModal: (show?: boolean) => {
        set(state => ({
          showRecordingsModal: show !== undefined ? show : !state.showRecordingsModal
        }))
      },

      // State Management Actions
      setCurrentMeeting: (meeting: Meeting | null) => {
        set({ currentMeeting: meeting })
      },

      clearError: () => {
        set({ error: null })
      },

      reset: () => {
        set(initialState)
      }
    }),
    {
      name: 'meeting-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
)
