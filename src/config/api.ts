import axios from 'axios';
import Cookies from 'js-cookie';

export const API_CONFIG = {
  baseURL: 'https://employee-monitering-sys.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
}

export const API_BASE_URL = API_CONFIG.baseURL

// Create axios instance with interceptors
export const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Check for token in cookies first (as used by auth store)
    const cookieToken = Cookies.get('thisisjustarandomstring');
    let token = null;
    
    if (cookieToken) {
      try {
        token = JSON.parse(cookieToken);
      } catch (error) {
        console.error('Error parsing token from cookie:', error);
      }
    }
    
    // Fallback to localStorage/sessionStorage
    if (!token) {
      token = localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      Cookies.remove('thisisjustarandomstring');
      Cookies.remove('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  auth: {
    adminLogin: '/admin/adminLogin',
    employeeLogin: '/employee/login',
    logout: '/auth/logout',
    validate: '/auth/validate',
  },
  admin: {
    createEmployee: '/admin/createEmployee',
    getAllEmployees: '/admin/employees',
    updateEmployee: '/admin/employees',
    deleteEmployee: '/admin/employees',
    showEmpLeaves: '/admin/showEmpLeaves',
    empLeavePermit: '/admin/empLeavePermit',
    empDashboard: '/admin/empDashBoard',
    dashboardOverview: '/admin/dashboard/overview',
    dashboardPerformance: '/admin/dashboard/performance',
    dashboardAttendance: '/admin/dashboard/attendance',
    dashboardTasks: '/admin/dashboard/tasks',
    profile: '/admin/profile',
  },
  employee: {
    editProfile: '/employee/editProfile',
    profile: '/employee/profile',
    // setNewPassword: '/employee/setNewPassword',
    // resetPassword: '/employee/resetPassword',
    notifications: '/employee/notifications',
  },
  bench: {
    empWorkingList: '/bench/empWorkingList',
  },
  timesheet: {
    clockIn: '/timeSheet/clockIn',
    clockOut: '/timeSheet/clockOut',
    breakStart: '/timeSheet/breakStart',
    breakEnd: '/timeSheet/breakEnd',
    currentStatus: '/timeSheet/currentStatus',
  },
  adminTimesheet: {
    allTimesheets: '/admin-timesheet/all-timesheets',
    dateWiseHistory: '/admin-timesheet/date-wise-history',
    todaySummary: '/admin-timesheet/today-summary',
    employeeTimesheet: '/admin-timesheet/employee-timesheet',
    activitySnapshots: '/admin-timesheet/activity-snapshots',
    updateActivitySnapshot: '/admin-timesheet/update-activity-snapshot',
  },
  tasks: {
    create: '/tasks/create',
    all: '/tasks/all',
    getById: '/tasks',
    update: '/tasks',
    delete: '/tasks',
    updateStatus: '/tasks',
  },
  empTasks: {
    myTasks: '/emp-tasks/my-tasks',
    myTaskStats: '/emp-tasks/my-task-stats',
  },
  screenshots: {
    upload: '/screenshots/upload',
    getAll: '/screenshots',
    getEmployee: '/screenshots/employee',
    delete: '/screenshots',
    download: '/screenshots/download',
  },
  monitoring: {
    realtime: '/monitoring/realtime',
    summary: '/monitoring/summary',
    export: '/monitoring/export',
    settings: '/monitoring/settings',
  },
  agentWorkingApps: {
    set: '/agent-working-apps/set',
    summary: '/agent-working-apps/summary',
    employee: '/agent-working-apps/employee',
  },
  agentIdleTime: {
    add: '/agent-idle-time/add',
    summary: '/agent-idle-time/summary',
    employee: '/agent-idle-time/employee',
  },
}

