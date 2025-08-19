import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/stores/authStore'
import { LeaveService, LeaveHistory, LeaveApprovalRequest } from '@/services/leaveService'
import { toast } from 'sonner'
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react'

export default function AdminLeaveManagement() {
  const { accessToken, isAdmin } = useAuth()
  const [leaveRequests, setLeaveRequests] = useState<LeaveHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeave, setSelectedLeave] = useState<LeaveHistory | null>(null)
  const [adminMessage, setAdminMessage] = useState('')
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)

  useEffect(() => {
    if (accessToken && isAdmin()) {
      fetchLeaveRequests()
    }
  }, [accessToken])

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true)
      const response = await LeaveService.getAllLeaveRequests(accessToken)
      if (response.success) {
        setLeaveRequests(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error)
      toast.error('Failed to fetch leave requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReject = async (status: 'APPROVE' | 'REJECT') => {
    if (!selectedLeave) return

    try {
      setApprovalLoading(true)
      const approvalData: LeaveApprovalRequest = {
        status,
        adminMessage: adminMessage || (status === 'APPROVE' ? 'Leave approved. Enjoy your time off!' : 'Leave request rejected.')
      }

      const response = await LeaveService.approveRejectLeave(accessToken, selectedLeave.id, approvalData)
      
      if (response.success) {
        toast.success(response.message || `Leave ${status.toLowerCase()}d successfully`)
        setApprovalDialogOpen(false)
        setSelectedLeave(null)
        setAdminMessage('')
        fetchLeaveRequests() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating leave status:', error)
      toast.error('Failed to update leave status')
    } finally {
      setApprovalLoading(false)
    }
  }

  const openApprovalDialog = (leave: LeaveHistory, action: 'approve' | 'reject') => {
    setSelectedLeave(leave)
    setAdminMessage('')
    setApprovalDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const colorClass = LeaveService.getStatusColor(status)
    return <Badge className={colorClass}>{status}</Badge>
  }

  const getLeaveTypeBadge = (leaveType: string) => {
    const colorClass = LeaveService.getLeaveTypeColor(leaveType)
    return <Badge className={colorClass}>{leaveType}</Badge>
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
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Review and manage employee leave requests</p>
        </div>
        <Button onClick={fetchLeaveRequests} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {leaveRequests.filter(leave => leave.status === 'PENDING').length}
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
              {leaveRequests.filter(leave => leave.status === 'APPROVED').length}
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
              {leaveRequests.filter(leave => leave.status === 'REJECTED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Requests
          </CardTitle>
          <CardDescription>
            Review and manage employee leave requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No leave requests</h3>
              <p className="text-muted-foreground">
                No pending leave requests at the moment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Employee</th>
                    <th className="text-left p-4 font-medium">Leave Type</th>
                    <th className="text-left p-4 font-medium">Duration</th>
                    <th className="text-left p-4 font-medium">Dates</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Message</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((leave) => (
                    <tr key={leave.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{leave.employee?.empName || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{leave.employee?.empEmail}</div>
                          <div className="text-xs text-muted-foreground">{leave.employee?.empTechnology}</div>
                        </div>
                      </td>
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
                          {leave.adminMessage && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Admin: {leave.adminMessage}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {leave.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => openApprovalDialog(leave, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openApprovalDialog(leave, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {leave.status !== 'PENDING' && (
                          <span className="text-sm text-muted-foreground">
                            {leave.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedLeave && (
                <>
                  {selectedLeave.status === 'PENDING' ? 'Review Leave Request' : 'Leave Details'}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedLeave && (
                <div className="space-y-2">
                  <p><strong>Employee:</strong> {selectedLeave.employee?.empName}</p>
                  <p><strong>Leave Type:</strong> {selectedLeave.leaveType}</p>
                  <p><strong>Duration:</strong> {LeaveService.calculateLeaveDuration(selectedLeave.startDate, selectedLeave.endDate)} days</p>
                  <p><strong>Dates:</strong> {LeaveService.formatDate(selectedLeave.startDate)} - {LeaveService.formatDate(selectedLeave.endDate)}</p>
                  <p><strong>Message:</strong> {selectedLeave.message}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLeave?.status === 'PENDING' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Admin Message (Optional)</label>
                <Textarea
                  placeholder="Add a message for the employee..."
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            {selectedLeave?.status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setApprovalDialogOpen(false)}
                  disabled={approvalLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleApproveReject('APPROVE')}
                  disabled={approvalLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {approvalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleApproveReject('REJECT')}
                  disabled={approvalLoading}
                >
                  {approvalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
              </>
            )}
            {selectedLeave?.status !== 'PENDING' && (
              <Button onClick={() => setApprovalDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



