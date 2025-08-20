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
  IconEye
} from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useState, useEffect } from 'react'
import monitoringService, { MonitoringSummary } from '@/services/monitoringService'
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

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching monitoring data for date:', selectedDate);
      
      // Fetch monitoring data
      const [summaryData, appUsageSummary, attendanceStatus] = await Promise.all([
        monitoringService.getMonitoringSummary(selectedDate).catch(err => {
          console.error('Error fetching summary:', err);
          return null;
        }),
        monitoringService.getAppUsageSummary(selectedDate).catch(err => {
          console.error('Error fetching app usage:', err);
          return [];
        }),
        monitoringService.getCurrentAttendanceStatus().catch(err => {
          console.error('Error fetching attendance status:', err);
          return [];
        })
      ]);

      console.log('📊 Summary data:', summaryData);
      console.log('💻 App usage data:', appUsageSummary);
      console.log('⏰ Attendance status:', attendanceStatus);
      
      // Debug: Log each employee's data processing
      appUsageSummary.forEach((emp, index) => {
        console.log(`🔍 Employee ${index + 1}:`, {
          name: emp.employee?.empName,
          id: emp.employee?.id,
          totalApps: emp.totalApps,
          totalKeysPressed: emp.totalKeysPressed,
          totalMouseClicks: emp.totalMouseClicks,
          productivity: Math.min(100, Math.round(((emp.totalKeysPressed + emp.totalMouseClicks) / 1000) * 100))
        });
      });

      setSummary(summaryData);

      // Process employee data from app usage and attendance
      const employeeStatuses: EmployeeStatus[] = appUsageSummary.map((emp: any) => {
        const employee = emp.employee;
        const totalActivity = emp.totalKeysPressed + emp.totalMouseClicks;
        const productivity = totalActivity > 0 ? Math.min(100, Math.round((totalActivity / 1000) * 100)) : 0;
        
        // Since we don't have lastActivity in app usage data, assume recent activity if they have app data
        const hasAppActivity = emp.totalApps > 0 && (emp.totalKeysPressed > 0 || emp.totalMouseClicks > 0);
        
        // Find attendance status for this employee
        const attendance = attendanceStatus.find((att: any) => att.empId === employee?.id);
        const isClockedIn = attendance?.status === 'PRESENT' && !attendance?.clockOut;
        
        // If no attendance data, assume clocked in if they have app activity
        const assumedClockedIn = !attendance && hasAppActivity;
        
        // Determine status based on actual attendance and activity
        let status: 'active' | 'break' | 'offline' | 'away' = 'offline';
        
        if (isClockedIn || assumedClockedIn) {
          if (hasAppActivity) {
            if (productivity > 30) status = 'active';
            else if (productivity > 10) status = 'away';
            else status = 'break';
          } else {
            status = 'active'; // Clocked in but no app data yet
          }
        } else {
          status = 'offline'; // Not clocked in
        }
        
        return {
          id: employee?.id || 'unknown',
          name: employee?.empName || 'Unknown Employee',
          email: employee?.empEmail || 'unknown@example.com',
          status,
          initials: employee?.empName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'UN',
          lastActivity: new Date().toISOString(), // Use current time since we don't have this data
          currentApp: `${emp.totalApps} apps used`, // Show app count since we don't have current app
          productivity
        };
      });

      // If no app usage data, show empty state instead of placeholder
      if (employeeStatuses.length === 0) {
        console.log('⚠️ No app usage data found, showing empty state');
        setEmployees([]);
        return;
      }

      console.log('✅ Final employee statuses:', employeeStatuses);
      setEmployees(employeeStatuses);

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

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [selectedDate]);

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
            A real-time view of currently active user sessions.
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button onClick={fetchMonitoringData} variant="outline" size="icon">
            <IconRefresh className="h-4 w-4" />
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
              <CardTitle className='text-sm font-medium'>Offline</CardTitle>
              <IconUserOff className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{employees.filter(e => e.status === 'offline').length}</div>
              <p className='text-xs text-muted-foreground'>Users currently offline</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Away</CardTitle>
              <IconClock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{employees.filter(e => e.status === 'away').length}</div>
              <p className='text-xs text-muted-foreground'>Users currently away</p>
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
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className='bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow'>
              {/* Employee Screenshot */}
              <div className='bg-muted h-48 flex items-center justify-center relative overflow-hidden'>
                {employee.status === 'offline' ? (
                  <div className='text-muted-foreground text-sm text-center'>
                    <IconUserOff className='h-8 w-8 mx-auto mb-2' />
                    <div>Employee Offline</div>
                  </div>
                ) : (
                  <>
                    <div className='text-muted-foreground text-sm'>Screenshot Loading...</div>
                    {employee.status === 'active' && (
                      <div className='absolute top-2 right-2'>
                        <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse'></div>
                      </div>
                    )}
                  </>
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
          ))}
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
                  <th className='text-left p-4 font-medium'>Last Activity</th>
                  <th className='text-left p-4 font-medium'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
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
                ))}
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className='h-10 w-10'>
                <AvatarImage src={selectedEmployee?.avatar} alt={selectedEmployee?.name} />
                <AvatarFallback>{selectedEmployee?.initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-xl font-semibold">{selectedEmployee?.name}</div>
                <div className="text-sm text-muted-foreground">{selectedEmployee?.email}</div>
              </div>
            </DialogTitle>
            <DialogDescription>
              Detailed monitoring information for {selectedEmployee?.name}
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Screenshots</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <IconEye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Screenshots will appear here when available</p>
                    <p className="text-sm">Make sure the employee is clocked in and monitoring is active</p>
                  </div>
                </CardContent>
              </Card>

              {/* App Usage Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">App Usage Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <IconActivity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Detailed app usage data will appear here</p>
                    <p className="text-sm">This includes applications used, time spent, and activity patterns</p>
                  </div>
                </CardContent>
              </Card>

              {/* Productivity Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Productivity Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <IconClock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Productivity trends and analytics will appear here</p>
                    <p className="text-sm">Historical data and performance metrics</p>
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