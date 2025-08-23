import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  IconSearch, 
  IconLayoutList, 
  IconLayoutGrid, 
  IconFilter,
  IconUsers,
  IconCoffee,
  IconUserOff,
  IconClock,
  IconRefresh,
  IconActivity,
  IconEye,
  IconCalendar,
  IconChartBar,
  IconKeyboard,
  IconMouse,
  IconScreenshot,
  IconDownload,
  IconTrash
} from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useState, useEffect } from 'react'
import monitoringService, { MonitoringSummary, EmployeeMonitoringHistory } from '@/services/monitoringService'
import { toast } from 'sonner'

interface EmployeeStatus {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'break' | 'offline' | 'away';
  avatar?: string;
  initials: string;
  lastActivity: string;
  currentApp?: string;
  productivity: number;
}

export default function Monitoring() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filters, setFilters] = useState({
    active: true,
    break: true,
    offline: true,
    away: true
  });
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<MonitoringSummary | null>(null);
  const [employees, setEmployees] = useState<EmployeeStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeStatus | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [monitoringHistory, setMonitoringHistory] = useState<EmployeeMonitoringHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching monitoring data for date:', selectedDate);
      
      // Fetch comprehensive monitoring history instead of separate calls
      const historyData = await monitoringService.getMonitoringHistory(selectedDate);
      setMonitoringHistory(historyData);
      
      // Show success toast for manual refresh
      if (!loading) {
        toast.success('Monitoring data refreshed successfully');
      }
      
      // Update last updated timestamp
      setLastUpdated(new Date());
      
      // Process employee data from monitoring history
      const employeeStatuses: EmployeeStatus[] = historyData.map((emp) => {
        const totalActivity = emp.productivity.totalKeysPressed + emp.productivity.totalMouseClicks;
        const productivity = totalActivity > 0 ? Math.min(100, Math.round((totalActivity / 1000) * 100)) : 0;
        
        // Debug logging for status determination
        console.log(`🔍 Employee ${emp.employee.empName} status check:`, {
          clockIn: emp.attendance.clockIn,
          clockOut: emp.attendance.clockOut,
          status: emp.attendance.status,
          activeTimePercentage: emp.productivity.activeTimePercentage,
          totalActivity
        });
        
        // Determine status based on attendance data from today-summary endpoint
        let status: 'active' | 'break' | 'offline' | 'away' = 'offline';
        
        // Check if employee has clocked in today and hasn't clocked out
        if (emp.attendance.clockIn && !emp.attendance.clockOut) {
          // Employee is currently working (clocked in but not clocked out)
          if (emp.productivity.activeTimePercentage > 70) status = 'active';
          else if (emp.productivity.activeTimePercentage > 30) status = 'away';
          else status = 'break';
        } else if (emp.attendance.clockIn && emp.attendance.clockOut) {
          status = 'offline'; // Clocked out for the day
        } else if (!emp.attendance.clockIn) {
          status = 'offline'; // Haven't clocked in today
        }
        
        console.log(`✅ Employee ${emp.employee.empName} final status: ${status} (clockIn: ${emp.attendance.clockIn}, clockOut: ${emp.attendance.clockOut})`);
        
        return {
          id: emp.employee.id,
          name: emp.employee.empName,
          email: emp.employee.empEmail,
          status,
          initials: emp.employee.empName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'UN',
          lastActivity: new Date().toISOString(),
          currentApp: `${emp.appUsage.length} apps used`,
          productivity
        };
      });

      setEmployees(employeeStatuses);

      // Create summary from history data
      const summaryData: MonitoringSummary = {
        totalEmployees: historyData.length,
        activeEmployees: employeeStatuses.filter(e => e.status === 'active').length,
        screenshotsToday: historyData.reduce((sum, emp) => sum + emp.screenshots.length, 0),
        averageProductivity: Math.round(employeeStatuses.reduce((sum, emp) => sum + emp.productivity, 0) / employeeStatuses.length) || 0,
        totalIdleTime: Math.round(historyData.reduce((sum, emp) => sum + emp.productivity.totalIdleMinutes, 0))
      };
      
      setSummary(summaryData);

    } catch (error) {
      console.error('❌ Error fetching monitoring data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch monitoring data');
      toast.error('Failed to fetch monitoring data');
    } finally {
      setLoading(false);
    }
  };

  // Filter employees based on search and status filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters[employee.status];
    
    return matchesSearch && matchesStatus;
  });

  // Handle filter changes
  const handleFilterChange = (status: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      active: true,
      break: true,
      offline: true,
      away: true
    });
  };

  // Handle view details click
  const handleViewDetails = (employee: EmployeeStatus) => {
    setSelectedEmployee(employee);
    setShowDetailsModal(true);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setSelectedEmployee(null);
    setShowDetailsModal(false);
  };

  // Get status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className='bg-green-500 hover:bg-green-600'>Active</Badge>
      case 'break':
        return <Badge className='bg-orange-500 hover:bg-orange-600'>On Break</Badge>
      case 'offline':
        return <Badge variant='destructive'>Offline</Badge>
      case 'away':
        return <Badge variant='secondary'>Away</Badge>
      default:
        return <Badge variant='secondary'>{status}</Badge>
    }
  };

  // Get selected employee's monitoring history
  const getSelectedEmployeeHistory = () => {
    if (!selectedEmployee) return null;
    return monitoringHistory.find(emp => emp.employee.id === selectedEmployee.id);
  };

  // Auto-refresh interval - reduced to 15 seconds for more responsive updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [selectedDate]);

  // Refresh when page becomes visible (e.g., when user switches tabs back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible, refreshing monitoring data...');
        fetchMonitoringData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Keyboard shortcut for refresh (Ctrl+R or F5)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey && event.key === 'r') || event.key === 'F5') {
        event.preventDefault();
        console.log('🔄 Keyboard shortcut detected, refreshing monitoring data...');
        fetchMonitoringData();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch data on component mount and date change
  useEffect(() => {
    fetchMonitoringData();
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <Main>
      <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>User Monitoring</h2>
          <p className='text-muted-foreground'>
            A real-time view of currently active user sessions and historical monitoring data.
          </p>
          <p className='text-xs text-muted-foreground'>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button 
            onClick={fetchMonitoringData} 
            variant="outline" 
            size="sm"
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <IconActivity className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Error Loading Data</span>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
              <IconUsers className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{summary.totalEmployees}</div>
              <p className='text-xs text-muted-foreground'>All registered users</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Active</CardTitle>
              <IconActivity className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{summary.activeEmployees}</div>
              <p className='text-xs text-muted-foreground'>Currently active users</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>On Break</CardTitle>
              <IconCoffee className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{employees.filter(e => e.status === 'break').length}</div>
              <p className='text-xs text-muted-foreground'>Users currently on break</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Screenshots</CardTitle>
              <IconScreenshot className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{summary.screenshotsToday}</div>
              <p className='text-xs text-muted-foreground'>Captured today</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Avg Productivity</CardTitle>
              <IconChartBar className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{summary.averageProductivity}%</div>
              <p className='text-xs text-muted-foreground'>Team average</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Controls */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <div className='relative'>
            <IconSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search by name...'
              className='pl-10 w-80'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <Button 
            variant='outline' 
            size='icon'
            className={viewMode === 'list' ? 'bg-black hover:bg-gray-800 text-white border-black' : ''}
            onClick={() => setViewMode('list')}
          >
            <IconLayoutList className='h-4 w-4' />
          </Button>
          <Button 
            variant='outline' 
            size='icon'
            className={viewMode === 'grid' ? 'bg-black hover:bg-gray-800 text-white border-black' : ''}
            onClick={() => setViewMode('grid')}
          >
            <IconLayoutGrid className='h-4 w-4' />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='flex items-center space-x-2'>
                <IconFilter className='h-4 w-4' />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              <div className='p-2'>
                <h4 className='font-medium mb-2'>Filter by Status</h4>
                <div className='space-y-2'>
                  {Object.entries(filters).map(([status, checked]) => (
                    <div key={status} className='flex items-center space-x-2'>
                      <Checkbox 
                        id={status}
                        checked={checked}
                        onCheckedChange={() => handleFilterChange(status as keyof typeof filters)}
                      />
                      <label htmlFor={status} className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
                <DropdownMenuSeparator className='my-2' />
                <Button 
                  variant='ghost' 
                  size='sm' 
                  className='w-full justify-start'
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        /* Grid View */
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredEmployees.map((employee) => {
            const employeeHistory = monitoringHistory.find(emp => emp.employee.id === employee.id);
            const hasScreenshots = employeeHistory?.screenshots.length > 0;
            
            return (
              <div key={employee.id} className='bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow'>
                {/* Employee Screenshot */}
                <div className='bg-muted h-48 flex items-center justify-center relative overflow-hidden'>
                  {employee.status === 'offline' ? (
                    <div className='text-muted-foreground text-sm text-center'>
                      <IconUserOff className='h-8 w-8 mx-auto mb-2' />
                      <div>Employee Offline</div>
                    </div>
                  ) : hasScreenshots ? (
                    <div className='w-full h-full flex items-center justify-center'>
                      <img 
                        src={employeeHistory?.screenshots[0]?.imageUrl} 
                        alt={`Screenshot of ${employee.name}`}
                        className='w-full h-full object-cover'
                      />
                      {employee.status === 'active' && (
                        <div className='absolute top-2 right-2'>
                          <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse'></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='text-muted-foreground text-sm text-center'>
                      <IconScreenshot className='h-8 w-8 mx-auto mb-2' />
                      <div>No Screenshots</div>
                      <div className='text-xs'>Monitoring in progress</div>
                    </div>
                  )}
                </div>
                
                {/* Employee Info */}
                <div className='p-4'>
                  <div className='flex items-center space-x-3 mb-3'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={employee.avatar} alt={employee.name} />
                      <AvatarFallback className='text-xs'>{employee.initials}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                      <h3 className='font-semibold'>{employee.name}</h3>
                      <p className='text-sm text-muted-foreground'>{employee.email}</p>
                      <p className='text-xs text-muted-foreground'>Current: {employee.currentApp}</p>
                    </div>
                  </div>
                  
                  <div className='flex items-center justify-between mb-3'>
                    {getStatusBadge(employee.status)}
                    <div className='text-sm'>
                      <span className='font-medium'>{employee.productivity}%</span>
                      <span className='text-muted-foreground'> productive</span>
                    </div>
                  </div>

                  {/* Monitoring Stats */}
                  {employeeHistory && (
                    <div className='space-y-2 mb-3 text-xs text-muted-foreground'>
                      <div className='flex justify-between'>
                        <span>Screenshots:</span>
                        <span>{employeeHistory.screenshots.length}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Apps Used:</span>
                        <span>{employeeHistory.appUsage.length}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Idle Time:</span>
                        <span>{Math.round(employeeHistory.productivity.totalIdleMinutes)} min</span>
                      </div>
                    </div>
                  )}

                  <div className='flex space-x-2'>
                    <Button 
                      size='sm' 
                      variant='outline' 
                      className='flex-1'
                      onClick={() => handleViewDetails(employee)}
                    >
                      <IconEye className='h-3 w-3 mr-1' />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className='rounded-lg border'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b bg-muted/50'>
                  <th className='text-left p-4 font-medium'>Employee</th>
                  <th className='text-left p-4 font-medium'>Status</th>
                  <th className='text-left p-4 font-medium'>Current App</th>
                  <th className='text-left p-4 font-medium'>Productivity</th>
                  <th className='text-left p-4 font-medium'>Screenshots</th>
                  <th className='text-left p-4 font-medium'>Last Activity</th>
                  <th className='text-left p-4 font-medium'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => {
                  const employeeHistory = monitoringHistory.find(emp => emp.employee.id === employee.id);
                  
                  return (
                    <tr key={employee.id} className='border-b hover:bg-muted/50'>
                      <td className='p-4'>
                        <div className='flex items-center space-x-3'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage src={employee.avatar} alt={employee.name} />
                            <AvatarFallback>{employee.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className='font-medium'>{employee.name}</div>
                            <div className='text-sm text-muted-foreground'>{employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className='p-4'>
                        {getStatusBadge(employee.status)}
                      </td>
                      <td className='p-4 text-sm text-muted-foreground'>
                        {employee.currentApp}
                      </td>
                      <td className='p-4'>
                        <div className='flex items-center space-x-2'>
                          <div className='w-16 bg-gray-200 rounded-full h-2'>
                            <div 
                              className='bg-green-500 h-2 rounded-full' 
                              style={{ width: `${employee.productivity}%` }}
                            ></div>
                          </div>
                          <span className='text-sm font-medium'>{employee.productivity}%</span>
                        </div>
                      </td>
                      <td className='p-4 text-sm text-muted-foreground'>
                        {employeeHistory?.screenshots.length || 0}
                      </td>
                      <td className='p-4 text-sm text-muted-foreground'>
                        {new Date(employee.lastActivity).toLocaleTimeString()}
                      </td>
                      <td className='p-4'>
                        <div className='flex space-x-2'>
                          <Button 
                            size='sm' 
                            variant='outline'
                            onClick={() => handleViewDetails(employee)}
                          >
                            <IconEye className='h-3 w-3 mr-1' />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredEmployees.length === 0 && !loading && (
        <div className='text-center py-12'>
          <IconUsers className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
          <h3 className='text-lg font-medium mb-2'>
            {employees.length === 0 ? 'No monitoring data available' : 'No employees found'}
          </h3>
          <p className='text-muted-foreground mb-4'>
            {employees.length === 0 
              ? 'No employee activity data is currently being tracked. Make sure employees are logged in and the monitoring system is active.'
              : 'Try adjusting your search or filters to find what you\'re looking for.'
            }
          </p>
          {employees.length === 0 && (
            <Button onClick={fetchMonitoringData} variant='outline'>
              <IconRefresh className='h-4 w-4 mr-2' />
              Refresh Data
            </Button>
          )}
        </div>
      )}

      {/* Employee Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className='h-10 w-10'>
                <AvatarImage src={selectedEmployee?.avatar} alt={selectedEmployee?.name} />
                <AvatarFallback>{selectedEmployee?.initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xl font-semibold">{selectedEmployee?.name}</div>
                <div className="text-sm text-muted-foreground">{selectedEmployee?.email}</div>
                <div className="text-xs text-muted-foreground">Date: {selectedDate}</div>
              </div>
            </DialogTitle>
            <DialogDescription>
              Detailed monitoring information for {selectedEmployee?.name} on {selectedDate}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-6">
              {/* Current Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    {getStatusBadge(selectedEmployee.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Productivity:</span>
                    <span className="text-sm">{selectedEmployee.productivity}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current App:</span>
                    <span className="text-sm text-muted-foreground">{selectedEmployee.currentApp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Activity:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(selectedEmployee.lastActivity).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Screenshots Section */}
              {/* <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <IconScreenshot className="h-5 w-5" />
                    <span>Recent Screenshots</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const employeeHistory = getSelectedEmployeeHistory();
                    const screenshots = employeeHistory?.screenshots || [];
                    
                    if (screenshots.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <IconScreenshot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No screenshots available for this date</p>
                          <p className="text-sm">Make sure the employee is clocked in and monitoring is active</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {screenshots.map((screenshot) => (
                          <div key={screenshot.id} className="relative group">
                            <img 
                              src={screenshot.imageUrl} 
                              alt={`Screenshot at ${new Date(screenshot.createdAt).toLocaleTimeString()}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                                <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                                  <IconDownload className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" className="h-8 w-8 p-0">
                                  <IconTrash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 text-center">
                              {new Date(screenshot.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card> */}

              {/* Enhanced App Usage Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <IconActivity className="h-5 w-5" />
                    <span>App Usage Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const employeeHistory = getSelectedEmployeeHistory();
                    const appUsage = employeeHistory?.appUsage || [];
                    
                    if (appUsage.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <IconActivity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No app usage data available for this date</p>
                          <p className="text-sm">This includes applications used, time spent, and activity patterns</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{appUsage.length}</div>
                            <div className="text-xs text-muted-foreground">Total Apps Used</div>
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{employeeHistory?.productivity.totalKeysPressed || 0}</div>
                            <div className="text-xs text-muted-foreground">Total Keys Pressed</div>
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{employeeHistory?.productivity.totalMouseClicks || 0}</div>
                            <div className="text-xs text-muted-foreground">Total Mouse Clicks</div>
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">{employeeHistory?.productivity.activeTimePercentage || 0}%</div>
                            <div className="text-xs text-muted-foreground">Active Time</div>
                          </div>
                        </div>
                        
                        {/* Detailed App List */}
                        <div className="space-y-2">
                          <h4 className="font-medium">Application Details:</h4>
                          {appUsage.map((app, index) => (
                            <div key={app.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                              <div className="flex-1">
                                <div className="font-medium text-blue-600">{app.appName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(app.appOpenAt).toLocaleTimeString()} - {new Date(app.appCloseAt).toLocaleTimeString()}
                                </div>
                                {app.appPath && (
                                  <div className="text-xs text-muted-foreground font-mono">
                                    Path: {app.appPath}
                                  </div>
                                )}
                              </div>
                              <div className="text-right text-sm space-y-1">
                                <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                                  <IconKeyboard className="h-3 w-3 text-green-600" />
                                  <span className="font-medium">{app.keysPressed}</span>
                                  <span className="text-xs">keys</span>
                                </div>
                                <div className="flex items-center space-x-1 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                                  <IconMouse className="h-3 w-3 text-purple-600" />
                                  <span className="font-medium">{app.mouseClicks}</span>
                                  <span className="text-xs">clicks</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Activity Breakdown */}
                        <div className="space-y-2">
                          <h4 className="font-medium">Activity Breakdown:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="font-medium text-green-700 dark:text-green-300 mb-2">Keyboard Activity</div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Total Keys Pressed:</span>
                                  <span className="font-medium">{employeeHistory?.productivity.totalKeysPressed || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Average per App:</span>
                                  <span className="font-medium">
                                    {appUsage.length > 0 ? Math.round((employeeHistory?.productivity.totalKeysPressed || 0) / appUsage.length) : 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Most Active App:</span>
                                  <span className="font-medium">
                                    {appUsage.length > 0 ? appUsage.reduce((max, app) => app.keysPressed > max.keysPressed ? app : max).appName : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                              <div className="font-medium text-purple-700 dark:text-purple-300 mb-2">Mouse Activity</div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Total Mouse Clicks:</span>
                                  <span className="font-medium">{employeeHistory?.productivity.totalMouseClicks || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Average per App:</span>
                                  <span className="font-medium">
                                    {appUsage.length > 0 ? Math.round((employeeHistory?.productivity.totalMouseClicks || 0) / appUsage.length) : 0}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Most Active App:</span>
                                  <span className="font-medium">
                                    {appUsage.length > 0 ? appUsage.reduce((max, app) => app.mouseClicks > max.mouseClicks ? app : max).appName : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Real-time Desktop Activity */}
                        <div className="space-y-2">
                          <h4 className="font-medium">Real-time Desktop Activity:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="font-medium text-blue-700 dark:text-blue-300 mb-2">Currently Open Apps</div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Total Open:</span>
                                  <span className="font-medium">{appUsage.length}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Active Now:</span>
                                  <span className="font-medium">
                                    {appUsage.filter(app => {
                                      const now = new Date();
                                      const closeTime = new Date(app.appCloseAt);
                                      return closeTime > now;
                                    }).length}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Current App:</span>
                                  <span className="font-medium text-xs truncate">
                                    {selectedEmployee?.currentApp || 'Unknown'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                              <div className="font-medium text-orange-700 dark:text-orange-300 mb-2">Today's Activity</div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Keys Pressed:</span>
                                  <span className="font-medium">{employeeHistory?.productivity.totalKeysPressed || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Mouse Clicks:</span>
                                  <span className="font-medium">{employeeHistory?.productivity.totalMouseClicks || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total Actions:</span>
                                  <span className="font-medium">
                                    {(employeeHistory?.productivity.totalKeysPressed || 0) + (employeeHistory?.productivity.totalMouseClicks || 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="font-medium text-red-700 dark:text-red-300 mb-2">Session Stats</div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Session Start:</span>
                                  <span className="font-medium text-xs">
                                    {employeeHistory?.attendance.clockIn ? new Date(employeeHistory.attendance.clockIn).toLocaleTimeString() : 'N/A'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Work Hours:</span>
                                  <span className="font-medium">{employeeHistory?.attendance.totalWorkHours || 0}h</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Active Time:</span>
                                  <span className="font-medium">{employeeHistory?.productivity.activeTimePercentage || 0}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Productivity Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <IconChartBar className="h-5 w-5" />
                    <span>Productivity Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const employeeHistory = getSelectedEmployeeHistory();
                    
                    if (!employeeHistory) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <IconChartBar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No productivity data available</p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-muted p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {employeeHistory.productivity.activeTimePercentage}%
                            </div>
                            <div className="text-xs text-muted-foreground">Active Time</div>
                          </div>
                          <div className="bg-muted p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {Math.round(employeeHistory.productivity.totalIdleMinutes)}m
                            </div>
                            <div className="text-xs text-muted-foreground">Idle Time</div>
                          </div>
                          <div className="bg-muted p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {employeeHistory.attendance.totalWorkHours}h
                            </div>
                            <div className="text-xs text-muted-foreground">Work Hours</div>
                          </div>
                          <div className="bg-muted p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {employeeHistory.screenshots.length}
                            </div>
                            <div className="text-xs text-muted-foreground">Screenshots</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium">Attendance Summary:</h4>
                          <div className="bg-muted p-3 rounded">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Clock In:</span>
                                <span className="ml-2 text-muted-foreground">
                                  {employeeHistory.attendance.clockIn || 'Not recorded'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Clock Out:</span>
                                <span className="ml-2 text-muted-foreground">
                                  {employeeHistory.attendance.clockOut || 'Not recorded'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Status:</span>
                                <span className="ml-2 text-muted-foreground">
                                  {employeeHistory.attendance.status}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Total Hours:</span>
                                <span className="ml-2 text-muted-foreground">
                                  {employeeHistory.attendance.totalWorkHours} hours
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Electron Application Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <IconActivity className="h-5 w-5" />
                    <span>Electron Application Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">App Name:</span>
                        <span className="ml-2 text-muted-foreground">Tellis Technologies</span>
                      </div>
                      <div>
                        <span className="font-medium">Version:</span>
                        <span className="ml-2 text-muted-foreground">1.0.0</span>
                      </div>
                      <div>
                        <span className="font-medium">Platform:</span>
                        <span className="ml-2 text-muted-foreground">Windows</span>
                      </div>
                      <div>
                        <span className="font-medium">Architecture:</span>
                        <span className="ml-2 text-muted-foreground">x64</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </DialogContent>
      </Dialog>
     </div>
   </Main>
 );
 }