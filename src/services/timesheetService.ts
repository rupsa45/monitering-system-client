import { API_CONFIG, API_ENDPOINTS } from '@/config/api'

export interface ClockInResponse {
  success: boolean
  message: string
  clockInTime?: string
}

export interface ClockOutResponse {
  success: boolean
  message: string
  clockOutTime?: string
  workHours?: number
}

export interface TimesheetStatus {
  isClockedIn: boolean
  isClockedOut: boolean
  clockInTime?: string
  clockOutTime?: string
  workHours?: number
  status: 'PRESENT' | 'ABSENT' | 'LATE'
}

export class TimesheetService {
  private static getAuthHeaders(token: string) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  static async clockIn(token: string, userId: string): Promise<ClockInResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      
      console.log('TimesheetService - Clocking in user:', userId)
      
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.timesheet.clockIn}/${userId}`, {
        method: 'GET',
        headers,
      })

      console.log('TimesheetService - Clock in response status:', response.status)
      
      if (!response.ok) {
        const error = await response.json()
        console.log('TimesheetService - Clock in error:', error)
        throw new Error(error.message || 'Failed to clock in')
      }

      const result = await response.json()
      console.log('TimesheetService - Clock in result:', result)
      return result
    } catch (error) {
      console.error('TimesheetService clockIn error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred while clocking in')
    }
  }

  static async clockOut(token: string, userId: string): Promise<ClockOutResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      
      console.log('TimesheetService - Clocking out user:', userId)
      
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.timesheet.clockOut}/${userId}`, {
        method: 'PATCH',
        headers,
      })

      console.log('TimesheetService - Clock out response status:', response.status)
      
      if (!response.ok) {
        const error = await response.json()
        console.log('TimesheetService - Clock out error:', error)
        throw new Error(error.message || 'Failed to clock out')
      }

      const result = await response.json()
      console.log('TimesheetService - Clock out result:', result)
      return result
    } catch (error) {
      console.error('TimesheetService clockOut error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred while clocking out')
    }
  }

  static async getCurrentStatus(token: string, userId: string): Promise<TimesheetStatus> {
    try {
      const headers = this.getAuthHeaders(token)
      
      console.log('TimesheetService - Getting current status for user:', userId)
      
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.timesheet.currentStatus}/${userId}`, {
        method: 'GET',
        headers,
      })

      console.log('TimesheetService - Get status response status:', response.status)
      
      if (!response.ok) {
        const error = await response.json()
        console.log('TimesheetService - Get status error:', error)
        throw new Error(error.message || 'Failed to get current status')
      }

      const result = await response.json()
      console.log('TimesheetService - Get status result:', result)
      
      // Map backend response to frontend interface
      if (result.success && result.data) {
        return {
          isClockedIn: result.data.isClockedIn || false,
          isClockedOut: result.data.isClockedOut || false,
          clockInTime: result.data.clockInTime || undefined,
          clockOutTime: result.data.clockOutTime || undefined,
          workHours: result.data.workHours || undefined,
          status: result.data.status || 'ABSENT'
        }
      }
      
      // Return default status if no data
      return {
        isClockedIn: false,
        isClockedOut: false,
        status: 'ABSENT'
      }
    } catch (error) {
      console.error('TimesheetService getCurrentStatus error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred while getting current status')
    }
  }
}
