import { API_BASE_URL } from '@/config/api'

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}

export interface Screenshot {
  id: string
  imageUrl: string
  publicId: string
  createdAt: string
  updatedAt: string
  empId: string
  employee: {
    id: string
    empName: string
    email: string
    profilePic?: string
  }
}

export interface ScreenshotResponse {
  success: boolean
  message: string
  data?: {
    screenshots: Screenshot[]
    pagination: {
      currentPage: number
      totalPages: number
      totalScreenshots: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
  screenshot?: Screenshot
}

class ScreenshotService {
  private baseUrl = `${API_BASE_URL}/screenshots`

  async getEmployeeScreenshots(empId: string, page: number = 1, limit: number = 20): Promise<ScreenshotResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/employee/${empId}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching employee screenshots:', error)
      throw error
    }
  }

  async getAllScreenshots(page: number = 1, limit: number = 20): Promise<ScreenshotResponse> {
    try {
      const response = await fetch(`${this.baseUrl}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching all screenshots:', error)
      throw error
    }
  }

  async deleteScreenshot(screenshotId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${screenshotId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error deleting screenshot:', error)
      throw error
    }
  }

  async uploadScreenshot(agentId: string, file: File): Promise<ScreenshotResponse> {
    try {
      const formData = new FormData()
      formData.append('agentId', agentId)
      formData.append('files', file)

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error uploading screenshot:', error)
      throw error
    }
  }
}

export const screenshotService = new ScreenshotService()
