import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/stores/authStore'
import { AttendanceService, EmployeeTimesheet, DateWiseAttendanceHistory } from '@/services/attendanceService'
import { toast } from 'sonner'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Loader2,
  TrendingUp,
  Activity,
  BarChart3,
  ArrowLeft
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export default function AdminTimesheetAnalytics() {
  const { accessToken, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [timesheets, setTimesheets] = useState<EmployeeTimesheet[]>([])
  const [dateWiseHistory, setDateWiseHistory] = useState<DateWiseAttendanceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'datewise' | 'employee'>('datewise')
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [employeeHistory, setEmployeeHistory] = useState<EmployeeTimesheet[]>([])

  useEffect(() => {
    if (accessToken && isAdmin()) {
      if (viewMode === 'datewise') {
        fetchDateWiseHistory()
      } else if (viewMode === 'employee' && selectedEmployee) {
        fetchEmployeeHistory()
      } else {
        fetchAllTimesheets()
      }
    }
  }, [accessToken, viewMode, selectedEmployee])

  const fetchAllTimesheets = async () => {
    try {
      setLoading(true)
      // For analytics, we want all timesheets without date restrictions
      const response = await AttendanceService.getAllTimesheets(accessToken)
      console.log('API Response:', response)
      if (response.success) {
        console.log('Timesheets data:', response.data)
        setTimesheets(response.data)
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error)
      toast.error('Failed to fetch timesheets')
    } finally {
      setLoading(false)
    }
  }

  const fetchDateWiseHistory = async () => {
    try {
      setLoading(true)
      // Get date-wise history for the last 30 days by default
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const response = await AttendanceService.getDateWiseHistory(accessToken, startDate, endDate)
      console.log('Date-wise History API Response:', response)
      if (response.success) {
        console.log('Date-wise History data:', response.data)
        setDateWiseHistory(response.data)
      }
    } catch (error) {
      console.error('Error fetching date-wise history:', error)
      toast.error('Failed to fetch date-wise history')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeHistory = async () => {
    try {
      setLoading(true)
      // Get employee history for the last 30 days by default
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const response = await AttendanceService.getAllTimesheets(accessToken, startDate, endDate, selectedEmployee)
      console.log('Employee History API Response:', response)
      if (response.success) {
        console.log('Employee History data:', response.data)
        setEmployeeHistory(response.data)
      }
    } catch (error) {
      console.error('Error fetching employee history:', error)
      toast.error('Failed to fetch employee history')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    if (viewMode === 'datewise') {
      fetchDateWiseHistory()
    } else if (viewMode === 'employee' && selectedEmployee) {
      fetchEmployeeHistory()
    } else {
      fetchAllTimesheets()
    }
  }

  const filteredTimesheets = timesheets.filter(timesheet => {
    const matchesSearch = timesheet.employee?.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         timesheet.employee?.empEmail.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || timesheet.status === statusFilter.toUpperCase()
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const colorClass = AttendanceService.getStatusColor(status)
    return <Badge className={colorClass}>{status}</Badge>
  }

  const calculateWorkingHours = (timesheet: EmployeeTimesheet): string => {
    if (!timesheet.clockIn) return 'N/A'
    
    if (!timesheet.clockOut) {
      // If not clocked out, calculate hours from clock in to now
      const clockInTime = new Date(timesheet.clockIn)
      const now = new Date()
      const diffMs = now.getTime() - clockInTime.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      
      // Subtract break time if any
      const breakTimeHours = (timesheet.totalBreakTime || 0) / 60
      const actualWorkHours = Math.max(0, diffHours - breakTimeHours)
      
      return `${actualWorkHours.toFixed(2)}h (ongoing)`
    }
    
    // If clocked out, use the calculated hours from API or calculate manually
    if (timesheet.hoursLoggedIn && timesheet.hoursLoggedIn > 0) {
      return `${timesheet.hoursLoggedIn.toFixed(2)}h`
    }
    
    // Manual calculation if API doesn't provide hours
    const clockInTime = new Date(timesheet.clockIn)
    const clockOutTime = new Date(timesheet.clockOut)
    const diffMs = clockOutTime.getTime() - clockInTime.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    
    // Subtract break time
    const breakTimeHours = (timesheet.totalBreakTime || 0) / 60
    const actualWorkHours = Math.max(0, diffHours - breakTimeHours)
    
    return `${actualWorkHours.toFixed(2)}h`
  }

  const getEmployeeStatus = (timesheet: EmployeeTimesheet) => {
    if (timesheet.clockOut) {
      return <Badge variant="secondary">Completed</Badge>
    } else if (timesheet.breakStart && !timesheet.breakEnd) {
      return <Badge variant="outline" className="text-orange-600 border-orange-600">On Break</Badge>
    } else if (timesheet.clockIn) {
      return <Badge variant="default">Working</Badge>
    } else {
      return <Badge variant="outline">Not Started</Badge>
    }
  }

  // Calculate analytics based on view mode
  let totalEmployees = 0
  let presentEmployees = 0
  let absentEmployees = 0
  let lateEmployees = 0
  let totalWorkHours = 0

  if (viewMode === 'datewise') {
    // Calculate from date-wise history
    const allEmployees = new Set()
    dateWiseHistory.forEach(dateData => {
      dateData.employees.forEach(emp => {
        allEmployees.add(emp.empId)
        // Only count as present if they have actually clocked in
        if (emp.hasTimesheet && emp.clockIn) presentEmployees++
        if (!emp.hasTimesheet || !emp.clockIn) absentEmployees++
        if (emp.status === 'LATE') lateEmployees++
        totalWorkHours += emp.hoursLoggedIn || 0
      })
    })
    totalEmployees = allEmployees.size
  } else {
    // Calculate from regular timesheets
    totalEmployees = timesheets.length
    // Only count as present if they have actually clocked in
    presentEmployees = timesheets.filter(t => t.clockIn).length
    absentEmployees = timesheets.filter(t => !t.clockIn).length
    lateEmployees = timesheets.filter(t => t.status === 'LATE').length
    totalWorkHours = timesheets.reduce((total, t) => {
      const hours = t.hoursLoggedIn || 0
      return total + hours
    }, 0)
  }
  
  // Debug logging
  console.log('View mode:', viewMode)
  console.log('Timesheets state:', timesheets)
  console.log('Date-wise history state:', dateWiseHistory)
  
  const averageWorkHours = totalEmployees > 0 ? totalWorkHours / totalEmployees : 0

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">This page is only available for administrators.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate({ to: '/admin-attendance' })}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Attendance
          </Button>
          
        </div>
        
        <Button onClick={handleRefresh} disabled={loading} className="hover:bg-blue-600">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
             <div>
             <h1 className="text-3xl font-bold tracking-tight">Timesheet Analytics</h1>
             <p className="text-muted-foreground mt-1">Comprehensive attendance history and analytics</p>
           </div>
           
                       {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'datewise' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('datewise')}
              >
                Date-wise View
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List View
              </Button>
              <Button
                variant={viewMode === 'employee' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('employee')}
              >
                Employee History
              </Button>
            </div>
             {/* Analytics Summary Cards */}
       {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
         <Card className="border-0 shadow-sm bg-muted/50 hover:bg-muted/50 transition-colors">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Total Records</CardTitle>
             <Users className="h-4 w-4" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalEmployees}
             </div>
             <p className="text-xs mt-1">All time entries</p>
           </CardContent>
         </Card>

         <Card className="border-0 shadow-sm bg-muted/50 hover:bg-muted/50 transition-colors">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Present</CardTitle>
             <UserCheck className="h-4 w-4" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : presentEmployees}
             </div>
             <p className="text-xs mt-1">Employees clocked in</p>
           </CardContent>
         </Card>

         <Card className="border-0 shadow-sm bg-muted/50 hover:bg-muted/50 transition-colors">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Absent</CardTitle>
             <UserX className="h-4 w-4" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : absentEmployees}
             </div>
             <p className="text-xs mt-1">Employees not clocked in</p>
           </CardContent>
         </Card>

         <Card className="border-0 shadow-sm bg-muted/50 hover:bg-muted/50 transition-colors">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Late</CardTitle>
             <Clock className="h-4 w-4" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : lateEmployees}
             </div>
             <p className="text-xs mt-1">Late arrivals</p>
           </CardContent>
         </Card>

         <Card className="border-0 shadow-sm bg-muted/50 hover:bg-muted/50 transition-colors">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Avg Work Hours</CardTitle>
             <TrendingUp className="h-4 w-4" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : averageWorkHours.toFixed(1)}h
             </div>
             <p className="text-xs mt-1">Average per employee</p>
           </CardContent>
         </Card>
       </div> */}

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        {/* <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5 text-blue-600" />
            Search & Filters
          </CardTitle>
          <CardDescription>Filter and search through attendance records</CardDescription>
        </CardHeader> */}
                 <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div>
               <label className="text-sm font-medium">Search Employee</label>
               <div className="relative mt-1">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                   placeholder="Search by name or email..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10"
                 />
               </div>
             </div>
             
             <div>
               <label className="text-sm font-medium">Status Filter</label>
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                 <SelectTrigger className="mt-1">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Status</SelectItem>
                   <SelectItem value="present">Present</SelectItem>
                   <SelectItem value="absent">Absent</SelectItem>
                   <SelectItem value="late">Late</SelectItem>
                 </SelectContent>
               </Select>
             </div>

             <div>
               <label className="text-sm font-medium">Date Range</label>
               <Select value={dateFilter} onValueChange={setDateFilter}>
                 <SelectTrigger className="mt-1">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Time</SelectItem>
                   <SelectItem value="today">Today</SelectItem>
                   <SelectItem value="week">This Week</SelectItem>
                   <SelectItem value="month">This Month</SelectItem>
                 </SelectContent>
               </Select>
             </div>

             {viewMode === 'employee' && (
               <div>
                 <label className="text-sm font-medium">Select Employee</label>
                 <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                   <SelectTrigger className="mt-1">
                     <SelectValue placeholder="Choose an employee" />
                   </SelectTrigger>
                   <SelectContent>
                     {dateWiseHistory.flatMap(dateData => 
                       dateData.employees.map(emp => ({
                         value: emp.empId,
                         label: `${emp.empName} (${emp.empEmail})`
                       }))
                     ).filter((emp, index, arr) => 
                       arr.findIndex(e => e.value === emp.value) === index
                     ).map(emp => (
                       <SelectItem key={emp.value} value={emp.value}>
                         {emp.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             )}
           </div>
         </CardContent>
      </Card>

             {/* Timesheets Table */}
       <Card className="border-0 shadow-sm">
         <CardHeader className="pb-4">
                       <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              {viewMode === 'datewise' ? 'Date-wise Attendance History' : 
               viewMode === 'employee' ? 'Employee Attendance History' : 'Attendance History'}
            </CardTitle>
            <CardDescription>
              {viewMode === 'datewise' 
                ? `Showing ${dateWiseHistory.length} days of attendance data`
                : viewMode === 'employee'
                ? `Showing ${employeeHistory.length} records for selected employee`
                : `Showing ${filteredTimesheets.length} of ${timesheets.length} records`
              }
            </CardDescription>
         </CardHeader>
        <CardContent>
                     {loading ? (
             <div className="flex items-center justify-center h-48">
               <div className="text-center">
                 <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                 <p className="text-gray-600 font-medium">Loading attendance data...</p>
                 <p className="text-sm text-gray-500 mt-1">Please wait while we fetch the records</p>
               </div>
             </div>
                     ) : (viewMode === 'datewise' ? dateWiseHistory.length === 0 : 
                          viewMode === 'employee' ? employeeHistory.length === 0 : 
                          filteredTimesheets.length === 0) ? (
             <div className="text-center py-12">
               <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                 <Users className="h-8 w-8 text-gray-400" />
               </div>
               <h3 className="text-lg font-semibold mb-2 text-gray-700">
                 {viewMode === 'datewise' ? 'No attendance data found' : 
                  viewMode === 'employee' ? 'No employee history found' : 'No timesheets found'}
               </h3>
               <p className="text-gray-500 max-w-md mx-auto">
                 {searchTerm || statusFilter !== 'all' 
                   ? 'Try adjusting your filters to see more results.'
                   : viewMode === 'employee' && !selectedEmployee
                   ? 'Please select an employee to view their history.'
                   : 'No employee attendance data available for the selected criteria.'
                 }
               </p>
             </div>
           ) : viewMode === 'datewise' ? (
               // Date-wise view
               <div className="space-y-6">
                 {dateWiseHistory.map((dateData) => (
                   <div key={dateData.date} className="border rounded-lg p-4">
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="text-lg font-semibold">
                         {new Date(dateData.date).toLocaleDateString('en-US', { 
                           weekday: 'long', 
                           year: 'numeric', 
                           month: 'long', 
                           day: 'numeric' 
                         })}
                       </h3>
                       <Badge variant="outline" className="text-sm">
                         {dateData.employees.length} employees
                       </Badge>
                     </div>
                     
                     <div className="overflow-x-auto">
                       <table className="w-full">
                         <thead>
                           <tr className="border-b">
                             <th className="text-left p-4 font-semibold">Employee</th>
                             <th className="text-left p-4 font-semibold">Status</th>
                             <th className="text-left p-4 font-semibold">Clock In</th>
                             <th className="text-left p-4 font-semibold">Clock Out</th>
                             <th className="text-left p-4 font-semibold">Work Hours</th>
                             <th className="text-left p-4 font-semibold">Break Time</th>
                           </tr>
                         </thead>
                         <tbody>
                           {dateData.employees
                             .filter(emp => 
                               emp.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               emp.empEmail.toLowerCase().includes(searchTerm.toLowerCase())
                             )
                             .filter(emp => statusFilter === 'all' || emp.status === statusFilter.toUpperCase())
                             .map((employee, index) => (
                             <tr key={`${dateData.date}-${employee.empId}`} className={`border-b hover:bg-muted/50 transition-colors bg-muted/50`}>
                               <td className="p-4">
                                 <div>
                                   <div className="font-semibold">{employee.empName}</div>
                                   <div className="text-sm text-gray-600">{employee.empEmail}</div>
                                   <div className="text-xs px-2 py-1 rounded-full inline-block mt-1">
                                     {employee.empTechnology}
                                   </div>
                                 </div>
                               </td>
                               <td className="p-4">
                                 <div className="space-y-1">
                                   {getStatusBadge(employee.status)}
                                   {employee.hasTimesheet ? (
                                     employee.clockOut ? (
                                       <Badge variant="secondary">Completed</Badge>
                                     ) : (
                                       <Badge variant="default">Working</Badge>
                                     )
                                   ) : (
                                     <Badge variant="outline">No Record</Badge>
                                   )}
                                 </div>
                               </td>
                               <td className="p-4 font-medium">
                                 {employee.clockIn ? AttendanceService.formatTime(employee.clockIn) : 'N/A'}
                               </td>
                               <td className="p-4 font-medium">
                                 {employee.clockOut ? AttendanceService.formatTime(employee.clockOut) : 'N/A'}
                               </td>
                               <td className="p-4 font-semibold text-blue-600">
                                 {employee.hoursLoggedIn > 0 ? `${employee.hoursLoggedIn.toFixed(2)}h` : 'N/A'}
                               </td>
                               <td className="p-4">
                                 {employee.totalBreakTime ? `${employee.totalBreakTime}m` : '0m'}
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                                      </div>
                 ))}
               </div>
             ) : viewMode === 'employee' ? (
               // Employee history view
               <div className="overflow-x-auto rounded-lg border">
                 <table className="w-full">
                   <thead>
                     <tr className="border-b">
                       <th className="text-left p-4 font-semibold">Date</th>
                       <th className="text-left p-4 font-semibold">Status</th>
                       <th className="text-left p-4 font-semibold">Clock In</th>
                       <th className="text-left p-4 font-semibold">Clock Out</th>
                       <th className="text-left p-4 font-semibold">Work Hours</th>
                       <th className="text-left p-4 font-semibold">Break Time</th>
                     </tr>
                   </thead>
                   <tbody>
                     {employeeHistory
                       .filter(timesheet => 
                         timesheet.employee?.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         timesheet.employee?.empEmail.toLowerCase().includes(searchTerm.toLowerCase())
                       )
                       .filter(timesheet => statusFilter === 'all' || timesheet.status === statusFilter.toUpperCase())
                       .map((timesheet, index) => (
                       <tr key={timesheet.id} className={`border-b hover:bg-muted/50 transition-colors bg-muted/50`}>
                         <td className="p-4">
                           {AttendanceService.formatDate(timesheet.createdAt)}
                         </td>
                         <td className="p-4">
                           <div className="space-y-1">
                             {getStatusBadge(timesheet.status)}
                             {getEmployeeStatus(timesheet)}
                           </div>
                         </td>
                         <td className="p-4 font-medium">
                           {timesheet.clockIn ? AttendanceService.formatTime(timesheet.clockIn) : 'N/A'}
                         </td>
                         <td className="p-4 font-medium">
                           {timesheet.clockOut ? AttendanceService.formatTime(timesheet.clockOut) : 'N/A'}
                         </td>
                         <td className="p-4 font-semibold text-blue-600">
                           {calculateWorkingHours(timesheet)}
                         </td>
                         <td className="p-4">
                           {timesheet.totalBreakTime ? `${timesheet.totalBreakTime}m` : '0m'}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             ) : (
               // List view (original table)
               <div className="overflow-x-auto rounded-lg border">
                <table className="w-full">
                  <thead className="">
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold ">Employee</th>
                      <th className="text-left p-4 font-semibold ">Status</th>
                      <th className="text-left p-4 font-semibold ">Clock In</th>
                      <th className="text-left p-4 font-semibold ">Clock Out</th>
                      <th className="text-left p-4 font-semibold ">Work Hours</th>
                      <th className="text-left p-4 font-semibold ">Break Time</th>
                      <th className="text-left p-4 font-semibold ">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTimesheets.map((timesheet, index) => (
                      <tr key={timesheet.id} className={`border-b hover:bg-muted/50 transition-colors `}>
                        <td className="p-4">
                          <div>
                            <div className="font-semibold ">{timesheet.employee?.empName || 'Unknown'}</div>
                            <div className="text-sm text-gray-600">{timesheet.employee?.empEmail}</div>
                            <div className="text-xs  px-2 py-1 rounded-full inline-block mt-1">
                              {timesheet.employee?.empTechnology}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            {getStatusBadge(timesheet.status)}
                            {getEmployeeStatus(timesheet)}
                          </div>
                        </td>
                        <td className="p-4 font-medium">
                          {timesheet.clockIn ? AttendanceService.formatTime(timesheet.clockIn) : 'N/A'}
                        </td>
                        <td className="p-4  font-medium">
                          {timesheet.clockOut ? AttendanceService.formatTime(timesheet.clockOut) : 'N/A'}
                        </td>
                        <td className="p-4 font-semibold text-blue-600">
                          {calculateWorkingHours(timesheet)}
                        </td>
                        <td className="p-4 ">
                          {timesheet.totalBreakTime ? `${timesheet.totalBreakTime}m` : '0m'}
                        </td>
                        <td className="p-4 ">
                          {AttendanceService.formatDate(timesheet.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
