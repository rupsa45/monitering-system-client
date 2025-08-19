import { API_CONFIG, API_ENDPOINTS } from '@/config/api'

interface LoginCredentials {
  empEmail: string
  empPassword: string
}

interface LoginResponse {
  success: boolean
  message: string
  accessToken: string
  user?: {
    empId: number
    empEmail: string
    empName: string
    empRole: string
    empTechnology?: string
    empGender?: string
  }
}

interface ProfileResponse {
  success: boolean
  message: string
  data: {
    id: string
    empId: number
    empName: string
    empEmail: string
    empPhone: string
    empTechnology: string
    empGender: string
    empProfile: string
    empRole: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    statistics: {
      // Employee statistics
      totalLeaves?: number
      totalTimeSheets?: number
      totalTasks?: number
      completedTasks?: number
      completionRate?: number
      
      // Admin statistics
      totalEmployees?: number
      totalActiveEmployees?: number
      pendingLeaves?: number
      todayAttendance?: number
      taskCompletionRate?: number
      attendanceRate?: number
    }
  }
}

interface ProfileUpdateData {
  empTechnology?: string
  empPhone?: string
}

interface ProfileUpdateResponse {
  success: boolean
  message: string
  employee?: {
    id: string
    empName: string
    empEmail: string
    empPhone: string
    empTechnology: string
    empGender: string
    empProfile: string
    empRole: string
  }
}

export interface EmployeeWorkingListResponse {
  success: boolean
  message: string
  empData: Array<{
    id: string
    empName: string
    empEmail: string
    empRole: string
    updatedAt: string
  }>
}

export class AuthService {
  static async checkApiHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/health`, {
        method: 'GET',
        headers: API_CONFIG.headers,
      })
      return response.ok
    } catch (error) {
      console.error('API health check failed:', error)
      return false
    }
  }

  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('AuthService - Attempting login with URL:', `${API_CONFIG.baseURL}${API_ENDPOINTS.auth.employeeLogin}`)
      console.log('AuthService - Login credentials:', { email: credentials.empEmail, password: '***' })
      
      // Check API health first
      const isApiHealthy = await this.checkApiHealth()
      if (!isApiHealthy) {
        throw new Error('API server is not responding. Please check if the backend server is running.')
      }
      
      // Try employee login first
      let response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.auth.employeeLogin}`, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify(credentials),
      })

      if (response.ok) {
        const result = await response.json()
        return result
      }

      // If employee login fails, try admin login
      response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.auth.adminLogin}`, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }

      return response.json()
    } catch (error) {
      console.error('AuthService login error:', error)
      console.error('AuthService - Full error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error
      })
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to the server. Please check if the API server is running on http://localhost:9000')
      }
      
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred during login')
    }
  }

  static async logout(): Promise<void> {
    try {
      // Clear local storage/cookies instead of calling logout endpoint
      // since we're managing auth state locally
      return Promise.resolve()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  static async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.auth.validate}`, {
        method: 'GET',
        headers: {
          ...API_CONFIG.headers,
          'Authorization': `Bearer ${token}`,
        },
      })
      return response.ok
    } catch (error) {
      console.error('Token validation error:', error)
      return false
    }
  }

  static getAuthHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
    return headers
  }

  static async getUserProfile(token: string): Promise<ProfileResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      console.log('AuthService - Getting user profile with token:', token ? 'Available' : 'Not available')
      
      // Try employee profile first
      let response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.employee.profile}`, {
        method: 'GET',
        headers,
      })

      console.log('AuthService - Employee profile response status:', response.status)
      if (response.ok) {
        const result = await response.json()
        console.log('AuthService - Employee profile result:', result)
        return result
      }

      console.log('AuthService - Employee profile failed, trying admin profile')
      // If employee profile fails, try admin profile
      response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.admin.profile}`, {
        method: 'GET',
        headers,
      })

      console.log('AuthService - Admin profile response status:', response.status)
      if (!response.ok) {
        const error = await response.json()
        console.log('AuthService - Admin profile error:', error)
        throw new Error(error.message || 'Failed to fetch profile')
      }

      const adminResult = await response.json()
      console.log('AuthService - Admin profile result:', adminResult)
      return adminResult
    } catch (error) {
      console.error('AuthService getUserProfile error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred while fetching profile')
    }
  }

  static async updateEmployeeProfile(token: string, empId: string, data: ProfileUpdateData): Promise<ProfileUpdateResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      const url = `${API_CONFIG.baseURL}${API_ENDPOINTS.employee.editProfile.replace(':id', empId)}`
      
      console.log('AuthService - Updating profile with URL:', url)
      console.log('AuthService - Update data:', data)
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      })

      console.log('AuthService - Update profile response status:', response.status)
      
      if (!response.ok) {
        const error = await response.json()
        console.log('AuthService - Update profile error:', error)
        throw new Error(error.message || 'Failed to update profile')
      }

      const result = await response.json()
      console.log('AuthService - Update profile result:', result)
      return result
    } catch (error) {
      console.error('AuthService updateEmployeeProfile error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred while updating profile')
    }
  }

  static async getEmployeeWorkingList(token: string): Promise<EmployeeWorkingListResponse> {
    try {
      console.log('AuthService - Getting employee working list with token:', token ? 'Available' : 'Not available')
      
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.bench.empWorkingList}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()
      console.log('AuthService - Employee working list response:', data)
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch employee working list')
      }

      return data
    } catch (error) {
      console.error('AuthService - Error fetching employee working list:', error)
      throw error
    }
  }
}
