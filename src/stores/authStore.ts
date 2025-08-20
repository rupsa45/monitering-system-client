import Cookies from 'js-cookie'
import { create } from 'zustand'
import { useEffect } from 'react'

const ACCESS_TOKEN = 'thisisjustarandomstring'
const USER_DATA = 'user_data'

interface AuthUser {
  id: string
  empId?: string | number // Optional since database uses 'id' as primary key
  empName: string
  empEmail: string
  empPhone?: string
  empRole: string
  empTechnology?: string
  empProfile?: string
  empGender?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  statistics?: {
    totalLeaves?: number
    totalTimeSheets?: number
    totalTasks?: number
    completedTasks?: number
    completionRate?: number
    totalEmployees?: number
    totalActiveEmployees?: number
    pendingLeaves?: number
    todayAttendance?: number
    taskCompletionRate?: number
    attendanceRate?: number
  }
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()((set) => {
  let cookieState: string | undefined
  let userDataState: string | undefined
  let initToken = ''
  let initUser = null
  
  try {
    cookieState = Cookies.get(ACCESS_TOKEN)
    userDataState = Cookies.get(USER_DATA)
    initToken = cookieState ? JSON.parse(cookieState) : ''
    initUser = userDataState ? JSON.parse(userDataState) : null
  } catch (error) {
    console.error('Error initializing auth store:', error)
    // Clear corrupted cookies
    Cookies.remove(ACCESS_TOKEN)
    Cookies.remove(USER_DATA)
    initToken = ''
    initUser = null
  }
  
  return {
    auth: {
      user: initUser,
      setUser: (user) =>
        set((state) => {
          if (user) {
            Cookies.set(USER_DATA, JSON.stringify(user))
          } else {
            Cookies.remove(USER_DATA)
          }
          return { ...state, auth: { ...state.auth, user } }
        }),
      accessToken: initToken,
      setAccessToken: (accessToken) =>
        set((state) => {
          Cookies.set(ACCESS_TOKEN, JSON.stringify(accessToken))
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          Cookies.remove(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          Cookies.remove(ACCESS_TOKEN)
          Cookies.remove(USER_DATA)
          
          // Clear Electron session if available
          if ((window as any).electronAPI?.clearSession) {
            try {
              (window as any).electronAPI.clearSession()
              console.log('Electron session cleared on logout')
            } catch (error) {
              console.error('Error clearing Electron session:', error)
            }
          }
          
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          }
        }),
    },
  }
})

export const useAuth = () => {
  try {
    const auth = useAuthStore((state) => state.auth)
    return {
      user: auth.user,
      reset: auth.reset,
      setUser: auth.setUser,
      accessToken: auth.accessToken,
      setAccessToken: auth.setAccessToken,
      resetAccessToken: auth.resetAccessToken,
      isAuthenticated: () => !!auth.accessToken,
      isAdmin: () => auth.user?.empRole === 'admin',
      isEmployee: () => auth.user?.empRole === 'employee'
    }
  } catch (error) {
    console.error('Error in useAuth hook:', error)
    // Return default values if store is not available
    return {
      user: null,
      reset: () => {},
      setUser: () => {},
      accessToken: '',
      setAccessToken: () => {},
      resetAccessToken: () => {},
      isAuthenticated: () => false,
      isAdmin: () => false,
      isEmployee: () => false
    }
  }
}

// Function to validate token and refresh user data
export const validateAndRefreshUser = async () => {
  const { auth } = useAuthStore.getState()
  
  if (!auth.accessToken) {
    return false
  }

  try {
    // Import AuthService dynamically to avoid circular dependencies
    const { AuthService } = await import('@/services/authService')
    const response = await AuthService.getUserProfile(auth.accessToken)
    
    if (response.success && response.data) {
      // Update user data in store
      auth.setUser(response.data)
      return true
    } else {
      // Token is invalid, clear auth data
      auth.reset()
      return false
    }
  } catch (error) {
    console.error('Error validating token:', error)
    // Token is invalid, clear auth data
    auth.reset()
    return false
  }
}

// Hook to initialize auth state
export const useAuthInitializer = () => {
  const { accessToken, user } = useAuth()
  
  useEffect(() => {
    const initializeAuth = async () => {
      // If we have a token but no user data, try to fetch user data
      if (accessToken && !user) {
        await validateAndRefreshUser()
      }
    }
    
    initializeAuth()
  }, [accessToken, user])
}
