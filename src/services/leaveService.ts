import { API_CONFIG, API_ENDPOINTS } from '@/config/api'

// Types for leave data
export interface LeaveRequest {
  empId: string // Used for URL, not request body
  leaveType: 'CASUAL' | 'SICK' | 'ANNUAL' | 'MATERNITY' | 'PATERNITY'
  startDate: string
  endDate: string
  message: string
}

export interface LeaveRequestBody {
  leaveType: 'CASUAL' | 'SICK' | 'ANNUAL' | 'MATERNITY' | 'PATERNITY'
  startDate: string
  endDate: string
  message: string
}

export interface LeaveResponse {
  success: boolean
  message: string
  data?: any
}

export interface LeaveHistoryResponse {
  success: boolean
  message: string
  data?: {
    employee: {
      id: string
      empName: string
      empEmail: string
    }
    leaves: LeaveHistory[]
    statistics: any
    pagination: {
      currentPage: number
      totalPages: number
      totalItems: number
      itemsPerPage: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
    filters: {
      applied: any
    }
  }
}

export interface LeaveHistory {
  id: string
  empId: string
  leaveType: string
  startDate: string
  endDate: string
  message: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  adminMessage?: string
  createdAt: string
  updatedAt: string
  duration?: number
  workingDays?: number
  formattedStartDate?: string
  formattedEndDate?: string
  appliedOn?: string
  statusColor?: string
  leaveTypeIcon?: string
  employee?: {
    empName: string
    empEmail: string
    empTechnology: string
  }
}

export interface LeaveApprovalRequest {
  status: 'APPROVE' | 'REJECT'
  adminMessage: string
}

export class LeaveService {
  private static getAuthHeaders(token: string) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  // Employee leave methods
  static async applyForLeave(token: string, leaveData: LeaveRequest): Promise<LeaveResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      console.log('LeaveService - Sending request to:', `${API_CONFIG.baseURL}/empLeave/${leaveData.empId}`)
      
      // Remove empId from request body since it's in the URL
      const { empId, ...requestBody } = leaveData
      console.log('LeaveService - Request data:', requestBody)
      
      const response = await fetch(`${API_CONFIG.baseURL}/empLeave/${empId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('LeaveService - Error response:', errorData)
        throw new Error(errorData.message || 'Failed to apply for leave')
      }
      
      const result = await response.json()
      console.log('LeaveService - Success response:', result)
      return result
    } catch (error) {
      console.error('LeaveService applyForLeave error:', error)
      throw error
    }
  }

  static async getLeaveHistory(token: string, empId: string): Promise<LeaveHistoryResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      const response = await fetch(`${API_CONFIG.baseURL}/empLeave/getLeaveHistory/${empId}`, {
        method: 'GET',
        headers
      })
      
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to fetch leave history')
      }
      
      return await response.json()
    } catch (error) {
      console.error('LeaveService getLeaveHistory error:', error)
      throw error
    }
  }

  // Admin leave methods
  static async getAllLeaveRequests(token: string): Promise<LeaveResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      const response = await fetch(`${API_CONFIG.baseURL}/admin/showEmpLeaves`, {
        method: 'GET',
        headers
      })
      
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to fetch leave requests')
      }
      
      return await response.json()
    } catch (error) {
      console.error('LeaveService getAllLeaveRequests error:', error)
      throw error
    }
  }

  static async approveRejectLeave(token: string, leaveId: string, approvalData: LeaveApprovalRequest): Promise<LeaveResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      const response = await fetch(`${API_CONFIG.baseURL}/admin/empLeavePermit/${leaveId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(approvalData)
      })
      
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to update leave status')
      }
      
      return await response.json()
    } catch (error) {
      console.error('LeaveService approveRejectLeave error:', error)
      throw error
    }
  }

  // Helper methods
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  static calculateLeaveDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1 // Include both start and end dates
  }

  static getStatusColor(status: string): string {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-100'
      case 'REJECTED': return 'text-red-600 bg-red-100'
      case 'PENDING': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  static getLeaveTypeColor(leaveType: string): string {
    switch (leaveType) {
      case 'CASUAL': return 'text-blue-600 bg-blue-100'
      case 'SICK': return 'text-red-600 bg-red-100'
      case 'ANNUAL': return 'text-green-600 bg-green-100'
      case 'MATERNITY': return 'text-pink-600 bg-pink-100'
      case 'PATERNITY': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }
}
