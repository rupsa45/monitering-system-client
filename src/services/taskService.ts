import { API_CONFIG, API_ENDPOINTS } from '@/config/api'

export interface Employee {
  id: string
  empName: string
  empEmail: string
  empRole: string
  updatedAt: string
}

export interface CreateTaskData {
  title: string
  description: string
  assignedTo: string[]
  dueDate: string
}

export interface Task {
  id: string
  title: string
  status: string
  label: string
  assignee?: string
  assigneeName?: string
  assigneeEmail?: string
  description?: string
  dueDate?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateTaskResponse {
  success: boolean
  message: string
  task?: Task
}

export interface GetEmployeesResponse {
  success: boolean
  message: string
  empData?: Employee[]
}

export interface GetTasksResponse {
  success: boolean
  message: string
  tasks?: Task[]
}

export interface UpdateTaskStatusResponse {
  success: boolean
  message: string
}

export interface DeleteTaskResponse {
  success: boolean
  message: string
}

export class TaskService {
  static getAuthHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = { ...API_CONFIG.headers }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  static async getTasks(token: string): Promise<GetTasksResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      
      console.log('TaskService - Fetching tasks')
      
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.tasks.all}?includeInactive=true`, {
        method: 'GET',
        headers,
      })

      console.log('TaskService - Get tasks response status:', response.status)
      
      if (!response.ok) {
        const error = await response.json()
        console.log('TaskService - Get tasks error:', error)
        throw new Error(error.message || 'Failed to fetch tasks')
      }

      const result = await response.json()
      console.log('TaskService - Get tasks result:', result)
      
      // Map backend response to frontend format
      if (result.success && result.data) {
        const mappedTasks: Task[] = result.data.map((backendTask: any) => {
          // Use backend status directly
          const status = backendTask.status || 'PENDING'

          return {
            id: backendTask.id,
            title: backendTask.title,
            status: status,
            label: status, // Use status as label
            assignee: backendTask.assignedEmployees?.[0]?.empName || '',
            assigneeName: backendTask.assignedEmployees?.[0]?.empName || '',
            assigneeEmail: backendTask.assignedEmployees?.[0]?.empEmail || '',
            description: backendTask.description || '',
            dueDate: backendTask.dueDate || '',
            isActive: backendTask.isActive !== undefined ? backendTask.isActive : true,
            createdAt: backendTask.createdAt,
            updatedAt: backendTask.updatedAt,
          }
        })
        
        return {
          success: true,
          message: result.message,
          tasks: mappedTasks
        }
      }
      
      return {
        success: false,
        message: result.message || 'No tasks found',
        tasks: []
      }
    } catch (error) {
      console.error('TaskService getTasks error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred while fetching tasks')
    }
  }

  static async createTask(token: string, taskData: CreateTaskData): Promise<CreateTaskResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      
      console.log('TaskService - Creating task with data:', taskData)
      
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.tasks.create}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(taskData),
      })

      console.log('TaskService - Create task response status:', response.status)
      
      if (!response.ok) {
        const error = await response.json()
        console.log('TaskService - Create task error:', error)
        throw new Error(error.message || 'Failed to create task')
      }

      const result = await response.json()
      console.log('TaskService - Create task result:', result)
      return result
    } catch (error) {
      console.error('TaskService createTask error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred while creating task')
    }
  }

  static async getEmployees(token: string): Promise<GetEmployeesResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      
      console.log('TaskService - Fetching employees')
      
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.bench.empWorkingList}`, {
        method: 'GET',
        headers,
      })

      console.log('TaskService - Get employees response status:', response.status)
      
      if (!response.ok) {
        const error = await response.json()
        console.log('TaskService - Get employees error:', error)
        throw new Error(error.message || 'Failed to fetch employees')
      }

      const result = await response.json()
      console.log('TaskService - Get employees result:', result)
      return result
    } catch (error) {
      console.error('TaskService getEmployees error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred while fetching employees')
    }
  }

  static async updateTaskStatus(token: string, taskId: string, isActive: boolean): Promise<UpdateTaskStatusResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      
      console.log('TaskService - Updating task status:', taskId, 'isActive:', isActive)
      
      let response
      
      if (!isActive) {
        // For deactivating: use DELETE /tasks/:taskId (inactiveTask method)
        console.log('TaskService - Using DELETE endpoint for deactivation')
        response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.tasks.getById}/${taskId}`, {
          method: 'DELETE',
          headers,
        })
      } else {
        // For activating: Since there's no specific activate endpoint, 
        // we'll need to create a new task or use a different approach
        // For now, let's show an error message
        console.log('TaskService - Activation not supported by backend yet')
        throw new Error('Task activation is not supported yet. Please contact the administrator.')
      }

      console.log('TaskService - Update task status response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('TaskService - Error response text:', errorText)
        
        let error
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { message: errorText }
        }
        
        console.log('TaskService - Update task status error:', error)
        throw new Error(error.message || 'Failed to update task status')
      }

      const result = await response.json()
      console.log('TaskService - Update task status result:', result)
      return result
    } catch (error) {
      console.error('TaskService updateTaskStatus error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred while updating task status')
    }
  }

  static async deleteTask(token: string, taskId: string): Promise<DeleteTaskResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      
      console.log('TaskService - Deleting task:', taskId)
      
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.tasks.delete}/${taskId}`, {
        method: 'DELETE',
        headers,
      })

      console.log('TaskService - Delete task response status:', response.status)
      
      if (!response.ok) {
        const error = await response.json()
        console.log('TaskService - Delete task error:', error)
        throw new Error(error.message || 'Failed to delete task')
      }

      const result = await response.json()
      console.log('TaskService - Delete task result:', result)
      return result
    } catch (error) {
      console.error('TaskService deleteTask error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred while deleting task')
    }
  }

  // Employee task methods
  static async getMyTasks(token: string, status?: string): Promise<GetTasksResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      const url = status 
        ? `${API_CONFIG.baseURL}${API_ENDPOINTS.empTasks.myTasks}?status=${status}`
        : `${API_CONFIG.baseURL}${API_ENDPOINTS.empTasks.myTasks}`
      
      console.log('TaskService getMyTasks - URL:', url)
      console.log('TaskService getMyTasks - Headers:', headers)
      
      const response = await fetch(url, { method: 'GET', headers })
      console.log('TaskService getMyTasks - Response status:', response.status)
      
      if (!response.ok) { 
        const errorData = await response.json()
        console.log('TaskService getMyTasks - Error response:', errorData)
        throw new Error(errorData.message || 'Failed to fetch tasks') 
      }
      
      const result = await response.json()
      console.log('TaskService getMyTasks - Raw API response:', result)
      
      // Map backend response to frontend format
      const tasks = result.data.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: this.mapBackendStatusToFrontend(task.status),
        label: 'feature',
        assignee: task.assignedEmployees?.[0]?.empName || 'Unassigned',
        assigneeName: task.assignedEmployees?.[0]?.empName || 'Unassigned',
        assigneeEmail: task.assignedEmployees?.[0]?.empEmail || '',
        dueDate: task.dueDate,
        isActive: task.isActive,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      }))
      
      console.log('TaskService getMyTasks - Mapped tasks:', tasks)
      return { success: true, tasks, total: result.total }
    } catch (error) {
      console.error('TaskService getMyTasks error:', error)
      throw error
    }
  }

  static async updateMyTaskStatus(token: string, taskId: string, status: string): Promise<UpdateTaskStatusResponse> {
    try {
      const headers = this.getAuthHeaders(token)
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.empTasks.myTasks}/${taskId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: this.mapFrontendStatusToBackend(status) })
      })
      
      if (!response.ok) { throw new Error((await response.json()).message || 'Failed to update task status') }
      return await response.json()
    } catch (error) {
      console.error('TaskService updateMyTaskStatus error:', error)
      throw error
    }
  }

  static async getMyTaskStats(token: string): Promise<any> {
    try {
      const headers = this.getAuthHeaders(token)
      const url = `${API_CONFIG.baseURL}${API_ENDPOINTS.empTasks.myTaskStats}`
      
      console.log('TaskService getMyTaskStats - URL:', url)
      console.log('TaskService getMyTaskStats - Headers:', headers)
      
      const response = await fetch(url, { method: 'GET', headers })
      console.log('TaskService getMyTaskStats - Response status:', response.status)
      
      if (!response.ok) { 
        const errorData = await response.json()
        console.log('TaskService getMyTaskStats - Error response:', errorData)
        throw new Error(errorData.message || 'Failed to fetch task stats') 
      }
      
      const result = await response.json()
      console.log('TaskService getMyTaskStats - Raw API response:', result)
      return result
    } catch (error) {
      console.error('TaskService getMyTaskStats error:', error)
      throw error
    }
  }

  // Helper methods for status mapping
  private static mapBackendStatusToFrontend(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'todo',
      'IN_PROGRESS': 'doing',
      'COMPLETED': 'done'
    }
    return statusMap[status] || 'todo'
  }

  private static mapFrontendStatusToBackend(status: string): string {
    const statusMap: { [key: string]: string } = {
      'todo': 'PENDING',
      'doing': 'IN_PROGRESS',
      'done': 'COMPLETED'
    }
    return statusMap[status] || 'PENDING'
  }
}
