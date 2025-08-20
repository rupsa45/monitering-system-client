import { API_CONFIG, API_ENDPOINTS, api } from '@/config/api'

export interface DashboardSummary {
  totalEmployees: number
  todayAttendance: number
  weekAttendance: number
  pendingLeaves: number
  activeTasks: number
}

export interface RecentActivity {
  id: string
  clockIn: string
  clockOut: string
  clockinIP: string
  hoursLoggedIn: number
  workingFrom: string
  breakStart: string
  breakEnd: string
  totalBreakTime: number
  totalWorkingDays: number
  dayPresent: string
  halfDay: number
  dayAbsent: string
  holidays: string
  dayLate: string
  status: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  empId: string
  employee: {
    empName: string
    empEmail: string
    empTechnology: string
  }
}

export interface DashboardOverview {
  summary: DashboardSummary
  recentActivities: RecentActivity[]
}

export interface DashboardResponse {
  success: boolean
  message: string
  data: DashboardOverview
}

export interface PerformanceAttendance {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  attendanceRate: string
}

export interface PerformanceTasks {
  totalAssigned: number
  completed: number
  inProgress: number
  pending: number
  completionRate: string
}

export interface PerformanceProductivity {
  averageWorkHours: string
  totalWorkHours: number
}

export interface EmployeePerformance {
  empName: string
  empEmail: string
  empTechnology: string
  attendance: {
    present: number
    absent: number
    late: number
    total: number
  }
  tasks: {
    completed: number
    inProgress: number
    pending: number
    total: number
  }
  workHours: number
}

export interface PerformanceData {
  attendance: PerformanceAttendance
  tasks: PerformanceTasks
  productivity: PerformanceProductivity
  employeePerformance: EmployeePerformance[]
}

export interface PerformanceResponse {
  success: boolean
  message: string
  data: PerformanceData
}

export class DashboardService {
  static async getDashboardOverview(accessToken: string): Promise<DashboardResponse> {
    try {
      const response = await api.get(API_ENDPOINTS.admin.dashboardOverview, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard overview:', error)
      throw error
    }
  }

  static async getDashboardPerformance(accessToken: string): Promise<PerformanceResponse> {
    try {
      const response = await api.get(API_ENDPOINTS.admin.dashboardPerformance, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard performance:', error)
      throw error
    }
  }

  static formatTime(timeString: string): string {
    if (!timeString) return 'N/A'
    const date = new Date(timeString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  static formatDate(dateString: string): string {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  static calculateWorkingHours(activity: RecentActivity): string {
    if (!activity.clockIn) return 'N/A'
    
    if (!activity.clockOut) {
      // If not clocked out, calculate hours from clock in to now
      const clockInTime = new Date(activity.clockIn)
      const now = new Date()
      const diffMs = now.getTime() - clockInTime.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      
      // Subtract break time if any
      const breakTimeHours = (activity.totalBreakTime || 0) / 60
      const actualWorkHours = Math.max(0, diffHours - breakTimeHours)
      
      return `${actualWorkHours.toFixed(2)}h (ongoing)`
    }
    
    // If clocked out, use the calculated hours from API or calculate manually
    if (activity.hoursLoggedIn && activity.hoursLoggedIn > 0) {
      return `${activity.hoursLoggedIn.toFixed(2)}h`
    }
    
    // Manual calculation if API doesn't provide hours
    const clockInTime = new Date(activity.clockIn)
    const clockOutTime = new Date(activity.clockOut)
    const diffMs = clockOutTime.getTime() - clockInTime.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    
    // Subtract break time
    const breakTimeHours = (activity.totalBreakTime || 0) / 60
    const actualWorkHours = Math.max(0, diffHours - breakTimeHours)
    
    return `${actualWorkHours.toFixed(2)}h`
  }
}
