import { API_CONFIG, API_ENDPOINTS } from '@/config/api'

export interface CreateEmployeeData {
  empName: string
  empEmail: string
  empPhone: string
  empPassword: string
  confirmPassword: string
  empTechnology: string
  empGender: 'MALE' | 'FEMALE'
}

export interface Employee {
  id: string
  empName: string
  empEmail: string
  empPhone: string
  empTechnology: string
  empRole: string
  empGender: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateEmployeeResponse {
  success: boolean
  message: string
  employee?: Employee
}

export interface GetEmployeesResponse {
  success: boolean
  message: string
  data: Employee[]
  total: number
}

export class EmployeeService {
  private static getAuthHeaders(token: string) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  static async createEmployee(token: string, employeeData: CreateEmployeeData): Promise<CreateEmployeeResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      console.log('EmployeeService createEmployee - URL:', `${API_CONFIG.baseURL}${API_ENDPOINTS.admin.createEmployee}`)
      console.log('EmployeeService createEmployee - Data:', employeeData)
      
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.admin.createEmployee}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(employeeData)
      })
      
      console.log('EmployeeService createEmployee - Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.log('EmployeeService createEmployee - Error response:', errorData)
        throw new Error(errorData.message || 'Failed to create employee')
      }
      
      const result = await response.json()
      console.log('EmployeeService createEmployee - Success response:', result)
      return result
    } catch (error) {
      console.error('EmployeeService createEmployee error:', error)
      throw error
    }
  }

  static async getAllEmployees(token: string): Promise<GetEmployeesResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.admin.getAllEmployees}`, {
        method: 'GET',
        headers
      })
      
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to fetch employees')
      }
      
      return await response.json()
    } catch (error) {
      console.error('EmployeeService getAllEmployees error:', error)
      throw error
    }
  }

  static async updateEmployee(token: string, employeeId: string, updateData: Partial<Employee>): Promise<CreateEmployeeResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.admin.updateEmployee}/${employeeId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to update employee')
      }
      
      return await response.json()
    } catch (error) {
      console.error('EmployeeService updateEmployee error:', error)
      throw error
    }
  }

  static async deleteEmployee(token: string, employeeId: string): Promise<{ success: boolean; message: string }> {
    try {
      const headers = this.getAuthHeaders(token)
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.admin.deleteEmployee}/${employeeId}`, {
        method: 'DELETE',
        headers
      })
      
      if (!response.ok) {
        throw new Error((await response.json()).message || 'Failed to delete employee')
      }
      
      return await response.json()
    } catch (error) {
      console.error('EmployeeService deleteEmployee error:', error)
      throw error
    }
  }
}
