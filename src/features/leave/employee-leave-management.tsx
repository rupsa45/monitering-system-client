import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/stores/authStore'
import { LeaveService, LeaveRequest, LeaveHistory } from '@/services/leaveService'
import { toast } from 'sonner'
import { 
  Calendar, 
  Clock, 
  Plus, 
  FileText, 
  RefreshCw, 
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function EmployeeLeaveManagement() {
  const { accessToken, user } = useAuth()
  const [leaveHistory, setLeaveHistory] = useState<LeaveHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [applyDialogOpen, setApplyDialogOpen] = useState(false)
  const [applying, setApplying] = useState(false)
  
  // Form state
  const [leaveType, setLeaveType] = useState<'CASUAL' | 'SICK' | 'ANNUAL' | 'MATERNITY' | 'PATERNITY'>('CASUAL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (accessToken && user) {
      fetchLeaveHistory()
    }
  }, [accessToken, user])

  const fetchLeaveHistory = async () => {
    try {
      setLoading(true)
      // Use the same logic as handleApplyLeave to get the correct employee ID
      const employeeId = user.empId || user.id
      if (!employeeId) {
        toast.error('Employee ID not found. Please log in again.')
        return
      }
      
      console.log('Fetching leave history for employee ID:', employeeId)
      const response = await LeaveService.getLeaveHistory(accessToken, employeeId)
      if (response.success) {
        // Backend returns data in response.data.leaves structure
        setLeaveHistory(response.data?.leaves || [])
        console.log('Leave history received:', response.data?.leaves)
      }
    } catch (error) {
      console.error('Error fetching leave history:', error)
      toast.error('Failed to fetch leave history')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyLeave = async () => {
    if (!user) return

    // Validation
    if (!startDate || !endDate || !message.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (new Date(startDate) < new Date()) {
      toast.error('Start date cannot be in the past')
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date cannot be before start date')
      return
    }

    // Validate employee ID
    const employeeId = user.empId || user.id
    if (!employeeId) {
      toast.error('Employee ID not found. Please log in again.')
      return
    }

    try {
      setApplying(true)
      const leaveData: LeaveRequest = {
        empId: employeeId,
        leaveType,
        startDate,
        endDate,
        message: message.trim()
      }

      console.log('Leave request data:', leaveData)
      console.log('User object:', user)
      console.log('Employee ID being used:', employeeId)

      const response = await LeaveService.applyForLeave(accessToken, leaveData)
      
      if (response.success) {
        toast.success(response.message || 'Leave request submitted successfully')
        setApplyDialogOpen(false)
        resetForm()
        fetchLeaveHistory() // Refresh the list
      }
    } catch (error) {
      console.error('Error applying for leave:', error)
      toast.error('Failed to submit leave request')
    } finally {
      setApplying(false)
    }
  }

  const resetForm = () => {
    setLeaveType('CASUAL')
    setStartDate('')
    setEndDate('')
    setMessage('')
  }

  const getStatusBadge = (status: string) => {
    const colorClass = LeaveService.getStatusColor(status)
    return <Badge className={colorClass}>{status}</Badge>
  }

  const getLeaveTypeBadge = (leaveType: string) => {
    const colorClass = LeaveService.getLeaveTypeColor(leaveType)
    return <Badge className={colorClass}>{leaveType}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Apply for leave and view your leave history</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchLeaveHistory} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Apply for Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Apply for Leave</DialogTitle>
                <DialogDescription>
                  Submit a new leave request. Please provide all required information.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select value={leaveType} onValueChange={(value: any) => setLeaveType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASUAL">Casual Leave</SelectItem>
                      <SelectItem value="SICK">Sick Leave</SelectItem>
                      <SelectItem value="ANNUAL">Annual Leave</SelectItem>
                      <SelectItem value="MATERNITY">Maternity Leave</SelectItem>
                      <SelectItem value="PATERNITY">Paternity Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="message">Reason for Leave</Label>
                  <Textarea
                    id="message"
                    placeholder="Please provide a detailed reason for your leave request..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                
                {startDate && endDate && (
                  <div className="text-sm text-muted-foreground">
                    Duration: {LeaveService.calculateLeaveDuration(startDate, endDate)} days
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setApplyDialogOpen(false)} disabled={applying}>
                  Cancel
                </Button>
                <Button onClick={handleApplyLeave} disabled={applying}>
                  {applying ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveHistory.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {leaveHistory.filter(leave => leave.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {leaveHistory.filter(leave => leave.status === 'APPROVED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {leaveHistory.filter(leave => leave.status === 'REJECTED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave History
          </CardTitle>
          <CardDescription>
            View all your leave requests and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : leaveHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No leave history</h3>
              <p className="text-muted-foreground">
                You haven't submitted any leave requests yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Leave Type</th>
                    <th className="text-left p-4 font-medium">Duration</th>
                    <th className="text-left p-4 font-medium">Dates</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Reason</th>
                    <th className="text-left p-4 font-medium">Admin Response</th>
                    <th className="text-left p-4 font-medium">Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveHistory.map((leave) => (
                    <tr key={leave.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        {getLeaveTypeBadge(leave.leaveType)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {LeaveService.calculateLeaveDuration(leave.startDate, leave.endDate)} days
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>{LeaveService.formatDate(leave.startDate)}</div>
                          <div className="text-muted-foreground">to</div>
                          <div>{LeaveService.formatDate(leave.endDate)}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(leave.status)}
                      </td>
                      <td className="p-4">
                        <div className="max-w-xs">
                          <p className="text-sm">{leave.message}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="max-w-xs">
                          {leave.adminMessage ? (
                            <p className="text-sm text-muted-foreground">{leave.adminMessage}</p>
                          ) : (
                            <span className="text-sm text-muted-foreground">No response yet</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {LeaveService.formatDate(leave.createdAt)}
                        </div>
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
