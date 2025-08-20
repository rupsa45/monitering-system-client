import { API_CONFIG, API_ENDPOINTS } from '@/config/api'

// Types for attendance data
export interface TimesheetStatus {
  isClockedIn: boolean
  isClockedOut: boolean
  isOnBreak: boolean
  clockInTime: string | null
  clockOutTime: string | null
  breakStartTime: string | null
  totalBreakTime: number
  status: string
}

export interface EmployeeTimesheet {
  id: string
  empId: string
  clockIn: string | null
  clockOut: string | null
  breakStart: string | null
  breakEnd: string | null
  hoursLoggedIn: number | null
  totalBreakTime: number | null
  status: string
  createdAt: string
  updatedAt: string
  employee?: {
    empName: string
    empEmail: string
    empTechnology: string
  }
}

export interface AttendanceSummary {
  totalEmployees: number
  presentToday: number
  absentToday: number
  onBreak: number
  averageWorkHours: number
}

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

export interface BreakResponse {
  success: boolean
  message: string
  breakStartTime?: string
  breakEndTime?: string
  breakDuration?: number
}

export interface TimesheetResponse {
  success: boolean
  message: string
  data: TimesheetStatus
}

export interface AllTimesheetsResponse {
  success: boolean
  message: string
  data: EmployeeTimesheet[]
  total: number
}

export interface DateWiseAttendanceHistory {
  date: string
  employees: {
    empId: string
    empName: string
    empEmail: string
    empTechnology: string
    date: string
    clockIn: string | null
    clockOut: string | null
    hoursLoggedIn: number
    totalBreakTime: number
    status: string
    hasTimesheet: boolean
    timesheetId?: string
    createdAt?: string
    updatedAt?: string
  }[]
}

export interface DateWiseHistoryResponse {
  success: boolean
  message: string
  data: DateWiseAttendanceHistory[]
  total: number
  dateRange: {
    start: string
    end: string
  }
  totalEmployees: number
}

export interface TodaySummaryResponse {
  success: boolean
  message: string
  data: AttendanceSummary
}

export class AttendanceService {
  private static getAuthHeaders(token: string) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  // Employee attendance methods
  static async getCurrentStatus(token: string, userId: string): Promise<TimesheetResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      console.log('AttendanceService getCurrentStatus - URL:', `${API_CONFIG.baseURL}${API_ENDPOINTS.timesheet.currentStatus}/${userId}`)
      console.log('AttendanceService getCurrentStatus - Headers:', headers)
      console.log('AttendanceService getCurrentStatus - User ID:', userId)
      
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.timesheet.currentStatus}/${userId}`, {
        method: 'GET',
        headers
      })
      
      console.log('AttendanceService getCurrentStatus - Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.log('AttendanceService getCurrentStatus - Error response:', errorData)
        throw new Error(errorData.message || 'Failed to fetch current status')
      }
      
      const result = await response.json()
      console.log('AttendanceService getCurrentStatus - Success response:', result)
      return result
    } catch (error) {
      console.error('AttendanceService getCurrentStatus error:', error)
      throw error
    }
  }

  static async clockIn(token: string, userId: string): Promise<ClockInResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.timesheet.clockIn}/${userId}`, {
        method: 'GET',
        headers
      })
      
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to clock in')
      }
      
      return await response.json()
    } catch (error) {
      console.error('AttendanceService clockIn error:', error)
      throw error
    }
  }

  static async clockOut(token: string, userId: string): Promise<ClockOutResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.timesheet.clockOut}/${userId}`, {
        method: 'PATCH',
        headers
      })
      
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to clock out')
      }
      
      return await response.json()
    } catch (error) {
      console.error('AttendanceService clockOut error:', error)
      throw error
    }
  }

  static async startBreak(token: string, userId: string): Promise<BreakResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.timesheet.breakStart}/${userId}`, {
        method: 'POST',
        headers
      })
      
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to start break')
      }
      
      return await response.json()
    } catch (error) {
      console.error('AttendanceService startBreak error:', error)
      throw error
    }
  }

  static async endBreak(token: string, userId: string): Promise<BreakResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.timesheet.breakEnd}/${userId}`, {
        method: 'POST',
        headers
      })
      
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to end break')
      }
      
      return await response.json()
    } catch (error) {
      console.error('AttendanceService endBreak error:', error)
      throw error
    }
  }

  // Admin attendance methods
  static async getAllTimesheets(token: string, startDate?: string, endDate?: string, empId?: string): Promise<AllTimesheetsResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      let url = `${API_CONFIG.baseURL}${API_ENDPOINTS.adminTimesheet.allTimesheets}`
      
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (empId) params.append('empId', empId)
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url, { method: 'GET', headers })
      
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to fetch timesheets')
      }
      
      const result = await response.json()
      console.log('AttendanceService getAllTimesheets - Raw API response:', result)
      
      // Map the API response to match the frontend interface
      if (result.success) {
        const mappedData = result.data || result.timeSheets || []
        console.log('AttendanceService getAllTimesheets - Mapped data:', mappedData)
        
        return {
          success: true,
          message: result.message,
          data: mappedData,
          total: result.total || mappedData.length
        }
      }
      
      return result
    } catch (error) {
      console.error('AttendanceService getAllTimesheets error:', error)
      throw error
    }
  }

  static async getDateWiseHistory(token: string, startDate?: string, endDate?: string, empId?: string): Promise<DateWiseHistoryResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      let url = `${API_CONFIG.baseURL}${API_ENDPOINTS.adminTimesheet.dateWiseHistory}`
      
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (empId) params.append('empId', empId)
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url, { method: 'GET', headers })
      
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to fetch date-wise history')
      }
      
      const result = await response.json()
      console.log('AttendanceService getDateWiseHistory - Raw API response:', result)
      
      return result
    } catch (error) {
      console.error('AttendanceService getDateWiseHistory error:', error)
      throw error
    }
  }

  static async getTodaySummary(token: string): Promise<TodaySummaryResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.adminTimesheet.todaySummary}`, {
        method: 'GET',
        headers
      })
      
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to fetch today summary')
      }
      
      const result = await response.json()
      console.log('AttendanceService getTodaySummary - Raw API response:', result)
      
      // Map the API response to match the frontend interface
      if (result.success && result.summary) {
        const mappedData: AttendanceSummary = {
          totalEmployees: result.summary.totalEmployees || 0,
          presentToday: result.summary.present || 0,
          absentToday: result.summary.absent || 0,
          onBreak: result.summary.onBreak || 0,
          averageWorkHours: result.summary.averageWorkHours || 0
        }
        
        console.log('AttendanceService getTodaySummary - Mapped data:', mappedData)
        
        return {
          success: true,
          message: result.message,
          data: mappedData
        }
      }
      
      return result
    } catch (error) {
      console.error('AttendanceService getTodaySummary error:', error)
      throw error
    }
  }

  static async getEmployeeTimesheet(token: string, empId: string): Promise<AllTimesheetsResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.adminTimesheet.employeeTimesheet}/${empId}`, {
        method: 'GET',
        headers
      })
      
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to fetch employee timesheet')
      }
      
      return await response.json()
    } catch (error) {
      console.error('AttendanceService getEmployeeTimesheet error:', error)
      throw error
    }
  }

  // Helper methods
  static formatTime(timeString: string | null): string {
    if (!timeString) return 'N/A'
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  static calculateWorkHours(clockIn: string | null, clockOut: string | null): number {
    if (!clockIn || !clockOut) return 0
    
    const start = new Date(clockIn)
    const end = new Date(clockOut)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    
    return Math.round(diffHours * 100) / 100
  }

  static getStatusColor(status: string): string {
    switch (status) {
      case 'PRESENT': return 'text-green-600 bg-green-100'
      case 'ABSENT': return 'text-red-600 bg-red-100'
      case 'LATE': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }
}
