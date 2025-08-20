import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/stores/authStore'
import { AttendanceService, EmployeeTimesheet, AttendanceSummary } from '@/services/attendanceService'
import { toast } from 'sonner'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Coffee, 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Loader2,
  TrendingUp,
  Activity
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export default function AdminAttendance() {
  const { accessToken, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [timesheets, setTimesheets] = useState<EmployeeTimesheet[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')

  useEffect(() => {
    if (accessToken && isAdmin()) {
      fetchTodaySummary()
      fetchAllTimesheets()
    }
  }, [accessToken])

  const fetchTodaySummary = async () => {
    try {
      setSummaryLoading(true)
      const response = await AttendanceService.getTodaySummary(accessToken)
      if (response.success) {
        setSummary(response.data)
      }
    } catch (error) {
      console.error('Error fetching today summary:', error)
      toast.error('Failed to fetch today summary')
    } finally {
      setSummaryLoading(false)
    }
  }

  const fetchAllTimesheets = async () => {
    try {
      setLoading(true)
      let startDate, endDate
      
      // Set date range based on filter
      if (dateFilter === 'today') {
        const today = new Date()
        startDate = today.toISOString().split('T')[0]
        endDate = today.toISOString().split('T')[0]
      } else if (dateFilter === 'week') {
        const today = new Date()
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate = weekAgo.toISOString().split('T')[0]
        endDate = today.toISOString().split('T')[0]
      } else if (dateFilter === 'month') {
        const today = new Date()
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        startDate = monthAgo.toISOString().split('T')[0]
        endDate = today.toISOString().split('T')[0]
      }

      const response = await AttendanceService.getAllTimesheets(accessToken, startDate, endDate)
      if (response.success) {
        setTimesheets(response.data)
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error)
      toast.error('Failed to fetch timesheets')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchTodaySummary()
    fetchAllTimesheets()
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Attendance</h1>
          <p className="text-muted-foreground">Monitor and manage employee attendance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate({ to: '/admin-timesheet' })}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : summary?.totalEmployees || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : summary?.presentToday || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summaryLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : summary?.absentToday || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Break</CardTitle>
            <Coffee className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summaryLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : summary?.onBreak || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Work Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summaryLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (summary?.averageWorkHours || 0).toFixed(1)}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timesheets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Employee Timesheets
          </CardTitle>
          <CardDescription>
            Showing {filteredTimesheets.length} of {timesheets.length} employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredTimesheets.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No timesheets found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'No employee timesheets available for the selected date range.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Employee</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Clock In</th>
                    <th className="text-left p-4 font-medium">Clock Out</th>
                    <th className="text-left p-4 font-medium">Work Hours</th>
                    <th className="text-left p-4 font-medium">Break Time</th>
                    <th className="text-left p-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTimesheets.map((timesheet) => (
                    <tr key={timesheet.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{timesheet.employee?.empName || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{timesheet.employee?.empEmail}</div>
                          <div className="text-xs text-muted-foreground">{timesheet.employee?.empTechnology}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {getStatusBadge(timesheet.status)}
                          {getEmployeeStatus(timesheet)}
                        </div>
                      </td>
                      <td className="p-4">
                        {AttendanceService.formatTime(timesheet.clockIn)}
                      </td>
                      <td className="p-4">
                        {AttendanceService.formatTime(timesheet.clockOut)}
                      </td>
                      <td className="p-4 font-medium">
                        {calculateWorkingHours(timesheet)}
                      </td>
                      <td className="p-4">
                        {timesheet.totalBreakTime ? `${timesheet.totalBreakTime}m` : '0m'}
                      </td>
                      <td className="p-4">
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