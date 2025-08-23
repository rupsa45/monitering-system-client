// Meeting Constants
export const MEETING_TYPES = {
  BASIC: 'BASIC',
  NORMAL: 'NORMAL',
  LONG: 'LONG'
} as const

export const MEETING_STATUSES = {
  SCHEDULED: 'SCHEDULED',
  LIVE: 'LIVE',
  ENDED: 'ENDED',
  CANCELED: 'CANCELED'
} as const

export const MEETING_ROLES = {
  HOST: 'HOST',
  COHOST: 'COHOST',
  PARTICIPANT: 'PARTICIPANT'
} as const

// Meeting Type Labels
export const MEETING_TYPE_LABELS = {
  [MEETING_TYPES.BASIC]: 'Basic Meeting',
  [MEETING_TYPES.NORMAL]: 'Normal Meeting',
  [MEETING_TYPES.LONG]: 'Long Meeting'
} as const

// Meeting Status Labels
export const MEETING_STATUS_LABELS = {
  [MEETING_STATUSES.SCHEDULED]: 'Scheduled',
  [MEETING_STATUSES.LIVE]: 'Live',
  [MEETING_STATUSES.ENDED]: 'Ended',
  [MEETING_STATUSES.CANCELED]: 'Canceled'
} as const

// Meeting Status Colors
export const MEETING_STATUS_COLORS = {
  [MEETING_STATUSES.SCHEDULED]: 'bg-yellow-500 hover:bg-yellow-600',
  [MEETING_STATUSES.LIVE]: 'bg-red-500 hover:bg-red-600',
  [MEETING_STATUSES.ENDED]: 'bg-gray-500 hover:bg-gray-600',
  [MEETING_STATUSES.CANCELED]: 'bg-gray-400 hover:bg-gray-500'
} as const

// Meeting Status Icons
export const MEETING_STATUS_ICONS = {
  [MEETING_STATUSES.SCHEDULED]: '📅',
  [MEETING_STATUSES.LIVE]: '🔴',
  [MEETING_STATUSES.ENDED]: '✅',
  [MEETING_STATUSES.CANCELED]: '❌'
} as const

// Meeting Type Icons
export const MEETING_TYPE_ICONS = {
  [MEETING_TYPES.BASIC]: '💬',
  [MEETING_TYPES.NORMAL]: '📋',
  [MEETING_TYPES.LONG]: '⏰'
} as const

// Default Meeting Settings
export const DEFAULT_MEETING_SETTINGS = {
  type: MEETING_TYPES.NORMAL,
  isPersistent: false,
  password: '',
  participants: []
} as const

// Meeting Validation Rules
export const MEETING_VALIDATION_RULES = {
  title: {
    minLength: 3,
    maxLength: 100,
    required: true
  },
  description: {
    maxLength: 500,
    required: false
  },
  scheduledStart: {
    required: true,
    minTimeFromNow: 5 // minutes
  },
  scheduledEnd: {
    required: true,
    minDuration: 15 // minutes
  },
  password: {
    minLength: 4,
    maxLength: 20,
    required: false
  }
} as const

// WebRTC Configuration
export const WEBRTC_CONFIG = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302'
      ]
    }
  ],
  iceCandidatePoolSize: 10
} as const

// Socket.IO Configuration
export const SOCKET_CONFIG = {
  serverUrl: 'http://localhost:9000',
  namespace: '/meetings',
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  timeout: 20000
} as const

// Meeting Recording Settings
export const RECORDING_SETTINGS = {
  maxFileSize: 500 * 1024 * 1024, // 500MB
  allowedFormats: [
    'video/webm',
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/mkv',
    'video/ogg'
  ],
  maxDuration: 4 * 60 * 60 * 1000 // 4 hours in milliseconds
} as const

// Helper Functions
export const formatMeetingDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatMeetingTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

export const formatMeetingDateTime = (dateString: string): string => {
  return `${formatMeetingDate(dateString)} at ${formatMeetingTime(dateString)}`
}

export const formatDuration = (startTime: string, endTime?: string): string => {
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

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const isMeetingInPast = (meeting: { scheduledStart: string }): boolean => {
  return new Date(meeting.scheduledStart) < new Date()
}

export const isMeetingStartingSoon = (meeting: { scheduledStart: string }, minutes: number = 15): boolean => {
  const now = new Date()
  const startTime = new Date(meeting.scheduledStart)
  const timeDiff = startTime.getTime() - now.getTime()
  const minutesDiff = timeDiff / (1000 * 60)
  
  return minutesDiff >= 0 && minutesDiff <= minutes
}

export const getMeetingStatusBadge = (status: keyof typeof MEETING_STATUSES) => {
  return {
    label: MEETING_STATUS_LABELS[status],
    color: MEETING_STATUS_COLORS[status],
    icon: MEETING_STATUS_ICONS[status]
  }
}

export const getMeetingTypeBadge = (type: keyof typeof MEETING_TYPES) => {
  return {
    label: MEETING_TYPE_LABELS[type],
    icon: MEETING_TYPE_ICONS[type]
  }
}

export const validateMeetingData = (data: unknown): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Title validation
  if (!data.title || data.title.trim().length < MEETING_VALIDATION_RULES.title.minLength) {
    errors.push(`Title must be at least ${MEETING_VALIDATION_RULES.title.minLength} characters`)
  }
  
  if (data.title && data.title.length > MEETING_VALIDATION_RULES.title.maxLength) {
    errors.push(`Title cannot exceed ${MEETING_VALIDATION_RULES.title.maxLength} characters`)
  }
  
  // Date validation
  if (!data.scheduledStart) {
    errors.push('Start time is required')
  } else {
    const startTime = new Date(data.scheduledStart)
    const now = new Date()
    const timeDiff = startTime.getTime() - now.getTime()
    const minutesDiff = timeDiff / (1000 * 60)
    
    if (minutesDiff < MEETING_VALIDATION_RULES.scheduledStart.minTimeFromNow) {
      errors.push(`Meeting must start at least ${MEETING_VALIDATION_RULES.scheduledStart.minTimeFromNow} minutes from now`)
    }
  }
  
  if (!data.scheduledEnd) {
    errors.push('End time is required')
  } else if (data.scheduledStart) {
    const startTime = new Date(data.scheduledStart)
    const endTime = new Date(data.scheduledEnd)
    const duration = endTime.getTime() - startTime.getTime()
    const minutesDuration = duration / (1000 * 60)
    
    if (minutesDuration < MEETING_VALIDATION_RULES.scheduledEnd.minDuration) {
      errors.push(`Meeting must be at least ${MEETING_VALIDATION_RULES.scheduledEnd.minDuration} minutes long`)
    }
    
    if (endTime <= startTime) {
      errors.push('End time must be after start time')
    }
  }
  
  // Password validation
  if (data.password) {
    if (data.password.length < MEETING_VALIDATION_RULES.password.minLength) {
      errors.push(`Password must be at least ${MEETING_VALIDATION_RULES.password.minLength} characters`)
    }
    
    if (data.password.length > MEETING_VALIDATION_RULES.password.maxLength) {
      errors.push(`Password cannot exceed ${MEETING_VALIDATION_RULES.password.maxLength} characters`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const isRecordingFileValid = (file: File): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > RECORDING_SETTINGS.maxFileSize) {
    return {
      isValid: false,
      error: `File size must be less than ${formatFileSize(RECORDING_SETTINGS.maxFileSize)}`
    }
  }
  
  // Check file format
  if (!RECORDING_SETTINGS.allowedFormats.includes(file.type)) {
    return {
      isValid: false,
      error: `File format not supported. Allowed formats: ${RECORDING_SETTINGS.allowedFormats.join(', ')}`
    }
  }
  
  return { isValid: true }
}
