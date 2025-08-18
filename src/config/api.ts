export const API_CONFIG = {
  baseURL: 'https://employee-monitering-sys-api.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
}

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
 
}

