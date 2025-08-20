import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  IconDownload,
  IconEye,
  IconActivity,
  IconBug
} from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import monitoringService, { 
  MonitoringSummary, 
  Screenshot, 
  AppUsage, 
  IdleTime,
  EmployeeMonitoringData 
} from '@/services/monitoringService';
import debugAuth from '@/utils/debugAuth';
import { toast } from 'sonner';

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

export default function RealTimeMonitoring() {
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
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [appUsage, setAppUsage] = useState<AppUsage[]>([]);
  const [idleTime, setIdleTime] = useState<IdleTime[]>([]);
  const [debugMode, setDebugMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching monitoring data for date:', selectedDate);
      
      // Run debug if in debug mode
      if (debugMode) {
        console.log('🔍 Debug Mode Enabled - Running Authentication Check');
        await debugAuth.runFullDebug();
      }
      
      // Fetch all monitoring data in parallel
      const [summaryData, screenshotsData, appUsageSummary, idleTimeSummary] = await Promise.all([
        monitoringService.getMonitoringSummary(selectedDate).catch(err => {
          console.error('Error fetching summary:', err);
          return null;
        }),
        monitoringService.getScreenshots(selectedDate).catch(err => {
          console.error('Error fetching screenshots:', err);
          return [];
        }),
        monitoringService.getAppUsageSummary(selectedDate).catch(err => {
          console.error('Error fetching app usage:', err);
          return [];
        }),
        monitoringService.getIdleTimeSummary(selectedDate).catch(err => {
          console.error('Error fetching idle time:', err);
          return [];
        })
      ]);

      console.log('📊 Summary data:', summaryData);
      console.log('📸 Screenshots data:', screenshotsData);
      console.log('💻 App usage data:', appUsageSummary);
      console.log('⏰ Idle time data:', idleTimeSummary);

      setSummary(summaryData);
      setScreenshots(screenshotsData);

      // Process employee data from app usage
      const employeeStatuses: EmployeeStatus[] = appUsageSummary.map((emp: any) => {
        const employee = emp.employee;
        const totalActivity = emp.totalKeysPressed + emp.totalMouseClicks;
        const productivity = totalActivity > 0 ? Math.min(100, Math.round((totalActivity / 1000) * 100)) : 0;
        
        // Determine status based on activity
        let status: 'active' | 'break' | 'offline' | 'away' = 'offline';
        if (emp.totalApps > 0) {
          if (productivity > 50) status = 'active';
          else if (productivity > 20) status = 'away';
          else status = 'break';
        }
        
        return {
          id: employee?.id || 'unknown',
          name: employee?.empName || 'Unknown Employee',
          email: employee?.empEmail || 'unknown@example.com',
          status,
          initials: employee?.empName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'UN',
          lastActivity: new Date().toISOString(),
          currentApp: 'Unknown App',
          productivity
        };
      });

      // If no app usage data, create placeholder employees
      if (employeeStatuses.length === 0) {
        console.log('⚠️ No app usage data found, creating placeholder employees');
        employeeStatuses.push({
          id: 'placeholder-1',
          name: 'No Activity Data',
          email: 'No employees with activity data found',
          status: 'offline',
          initials: 'NA',
          lastActivity: new Date().toISOString(),
          currentApp: 'No data',
          productivity: 0
        });
      }

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

  // Download screenshot
  const downloadScreenshot = async (screenshotId: string) => {
    try {
      const blob = await monitoringService.downloadScreenshot(screenshotId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot-${screenshotId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading screenshot:', error);
      toast.error('Failed to download screenshot');
    }
  };

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    console.log('🔍 Debug mode:', !debugMode ? 'ENABLED' : 'DISABLED');
  };

  const runDebugNow = async () => {
    console.log('🔍 Manual Debug Triggered');
    await debugAuth.runFullDebug();
  };

  // Test API endpoints manually
  const testAPIs = async () => {
    console.log('🧪 Testing API endpoints...');
    
    try {
      // Test screenshots API
      console.log('📸 Testing screenshots API...');
      const screenshots = await monitoringService.getScreenshots(selectedDate);
      console.log('Screenshots result:', screenshots);
      
      // Test app usage API
      console.log('💻 Testing app usage API...');
      const appUsage = await monitoringService.getAppUsageSummary(selectedDate);
      console.log('App usage result:', appUsage);
      
      // Test idle time API
      console.log('⏰ Testing idle time API...');
      const idleTime = await monitoringService.getIdleTimeSummary(selectedDate);
      console.log('Idle time result:', idleTime);
      
      toast.success('API tests completed! Check console for results.');
    } catch (error) {
      console.error('❌ API test failed:', error);
      toast.error('API test failed! Check console for details.');
    }
  };

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
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Real-time Monitoring</h2>
          <p className='text-muted-foreground'>
            Live view of employee activity and productivity metrics.
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
          <Button 
            onClick={toggleDebugMode} 
            variant={debugMode ? "default" : "outline"} 
            size="icon"
            title="Toggle Debug Mode"
          >
            <IconBug className="h-4 w-4" />
          </Button>
          {debugMode && (
            <>
              <Button onClick={runDebugNow} variant="outline" size="sm">
                Run Debug
              </Button>
              <Button onClick={testAPIs} variant="outline" size="sm">
                Test APIs
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Debug Mode Indicator */}
      {debugMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <IconBug className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">Debug Mode Active</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Authentication and API requests are being logged to the console. Check the browser console for detailed information.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <IconBug className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Error Loading Data</span>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Employees</CardTitle>
              <IconUsers className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{summary.totalEmployees}</div>
              <p className='text-xs text-muted-foreground'>All registered employees</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Active</CardTitle>
              <IconActivity className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{summary.activeEmployees}</div>
              <p className='text-xs text-muted-foreground'>Currently working</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Screenshots Today</CardTitle>
              <IconEye className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{summary.screenshotsToday}</div>
              <p className='text-xs text-muted-foreground'>Captured screenshots</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Avg Productivity</CardTitle>
              <IconActivity className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{summary.averageProductivity}%</div>
              <p className='text-xs text-muted-foreground'>Based on activity</p>
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
              placeholder='Search by name or email...'
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
              {/* Employee Screenshot Placeholder */}
              <div className='bg-muted h-48 flex items-center justify-center relative'>
                <div className='text-muted-foreground text-sm'>1280 x 720</div>
                {employee.status === 'active' && (
                  <div className='absolute top-2 right-2'>
                    <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse'></div>
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

                <div className='flex space-x-2'>
                  <Button size='sm' variant='outline' className='flex-1'>
                    <IconEye className='h-3 w-3 mr-1' />
                    View Details
                  </Button>
                  <Button size='sm' variant='outline'>
                    <IconDownload className='h-3 w-3' />
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
                        <Button size='sm' variant='outline'>
                          <IconEye className='h-3 w-3 mr-1' />
                          View
                        </Button>
                        <Button size='sm' variant='outline'>
                          <IconDownload className='h-3 w-3' />
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
      {filteredEmployees.length === 0 && (
        <div className='text-center py-12'>
          <IconUsers className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
          <h3 className='text-lg font-medium mb-2'>No employees found</h3>
          <p className='text-muted-foreground'>
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}
