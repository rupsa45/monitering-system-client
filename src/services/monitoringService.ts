import { api } from '@/config/api';

export interface Screenshot {
  id: string;
  imageUrl: string;
  publicId: string;
  empId: string;
  createdAt: string;
  employee?: {
    empName: string;
    empEmail: string;
  };
}

export interface AppUsage {
  id: string;
  appName: string;
  appPath?: string;
  appOpenAt: string;
  appCloseAt: string;
  keysPressed: number;
  mouseClicks: number;
  empId: string;
  employee?: {
    empName: string;
    empEmail: string;
  };
}

export interface IdleTime {
  id: string;
  from: string;
  to: string;
  duration: number;
  empId: string;
  employee?: {
    empName: string;
    empEmail: string;
  };
}

export interface MonitoringSummary {
  totalEmployees: number;
  activeEmployees: number;
  screenshotsToday: number;
  averageProductivity: number;
  totalIdleTime: number;
}

export interface EmployeeMonitoringData {
  employee: {
    id: string;
    empName: string;
    empEmail: string;
    empTechnology: string;
  };
  screenshots: Screenshot[];
  appUsage: AppUsage[];
  idleTime: IdleTime[];
  productivity: {
    totalKeysPressed: number;
    totalMouseClicks: number;
    totalIdleMinutes: number;
    activeTimePercentage: number;
  };
}

class MonitoringService {
  private baseUrl = '/api';

  // Get all screenshots for a specific date
  async getScreenshots(date?: string): Promise<Screenshot[]> {
    try {
      console.log('Fetching screenshots with date:', date);
      const params = date ? `?date=${date}` : '';
      const response = await api.get(`${this.baseUrl}/screenshots${params}`);
      console.log('Screenshots response:', response.data);
      return response.data.data?.screenshots || [];
    } catch (error) {
      console.error('Error fetching screenshots:', error);
      if (error.response?.status === 401) {
        console.error('Authentication failed - token may be missing or invalid');
      }
      throw error;
    }
  }

  // Get screenshots for a specific employee
  async getEmployeeScreenshots(employeeId: string, date?: string): Promise<Screenshot[]> {
    try {
      console.log('Fetching employee screenshots for:', employeeId, 'date:', date);
      const params = date ? `?date=${date}` : '';
      const response = await api.get(`${this.baseUrl}/screenshots/employee/${employeeId}${params}`);
      console.log('Employee screenshots response:', response.data);
      return response.data.data?.screenshots || [];
    } catch (error) {
      console.error('Error fetching employee screenshots:', error);
      throw error;
    }
  }

  // Get app usage summary for all employees
  async getAppUsageSummary(date?: string): Promise<any[]> {
    try {
      console.log('Fetching app usage summary with date:', date);
      const params = date ? `?date=${date}` : '';
      const response = await api.get(`${this.baseUrl}/agent-working-apps/summary${params}`);
      console.log('App usage summary response:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching app usage summary:', error);
      throw error;
    }
  }

  // Get app usage for a specific employee
  async getEmployeeAppUsage(employeeId: string, date?: string): Promise<AppUsage[]> {
    try {
      console.log('Fetching employee app usage for:', employeeId, 'date:', date);
      const params = date ? `?date=${date}` : '';
      const response = await api.get(`${this.baseUrl}/agent-working-apps/employee/${employeeId}${params}`);
      console.log('Employee app usage response:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching employee app usage:', error);
      throw error;
    }
  }

  // Get idle time summary for all employees
  async getIdleTimeSummary(date?: string): Promise<any[]> {
    try {
      console.log('Fetching idle time summary with date:', date);
      const params = date ? `?date=${date}` : '';
      const response = await api.get(`${this.baseUrl}/agent-idle-time/summary${params}`);
      console.log('Idle time summary response:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching idle time summary:', error);
      throw error;
    }
  }

  // Get idle time for a specific employee
  async getEmployeeIdleTime(employeeId: string, date?: string): Promise<IdleTime[]> {
    try {
      console.log('Fetching employee idle time for:', employeeId, 'date:', date);
      const params = date ? `?date=${date}` : '';
      const response = await api.get(`${this.baseUrl}/agent-idle-time/employee/${employeeId}${params}`);
      console.log('Employee idle time response:', response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching employee idle time:', error);
      throw error;
    }
  }

  // Get comprehensive monitoring data for an employee
  async getEmployeeMonitoringData(employeeId: string, date?: string): Promise<EmployeeMonitoringData> {
    try {
      const [screenshots, appUsage, idleTime] = await Promise.all([
        this.getEmployeeScreenshots(employeeId, date),
        this.getEmployeeAppUsage(employeeId, date),
        this.getEmployeeIdleTime(employeeId, date)
      ]);

      // Calculate productivity metrics
      const totalKeysPressed = appUsage.reduce((sum, app) => sum + app.keysPressed, 0);
      const totalMouseClicks = appUsage.reduce((sum, app) => sum + app.mouseClicks, 0);
      const totalIdleMinutes = idleTime.reduce((sum, idle) => sum + (idle.duration / 1000 / 60), 0);

      // Calculate active time percentage (assuming 8-hour workday)
      const workdayMinutes = 8 * 60; // 8 hours in minutes
      const activeTimePercentage = ((workdayMinutes - totalIdleMinutes) / workdayMinutes) * 100;

      return {
        employee: {
          id: employeeId,
          empName: screenshots[0]?.employee?.empName || 'Unknown',
          empEmail: screenshots[0]?.employee?.empEmail || 'Unknown',
          empTechnology: 'Unknown'
        },
        screenshots,
        appUsage,
        idleTime,
        productivity: {
          totalKeysPressed,
          totalMouseClicks,
          totalIdleMinutes: Math.round(totalIdleMinutes),
          activeTimePercentage: Math.round(activeTimePercentage)
        }
      };
    } catch (error) {
      console.error('Error fetching employee monitoring data:', error);
      throw error;
    }
  }

  // Get monitoring summary for dashboard
  async getMonitoringSummary(date?: string): Promise<MonitoringSummary> {
    try {
      console.log('Fetching monitoring summary with date:', date);
      const [screenshots, appUsageSummary, idleTimeSummary] = await Promise.all([
        this.getScreenshots(date),
        this.getAppUsageSummary(date),
        this.getIdleTimeSummary(date)
      ]);

      const totalEmployees = appUsageSummary.length;
      const activeEmployees = appUsageSummary.filter((emp: any) => emp.totalApps > 0).length;
      const screenshotsToday = screenshots.length;
      
      // Calculate average productivity
      const totalProductivity = appUsageSummary.reduce((sum: number, emp: any) => {
        const totalActivity = emp.totalKeysPressed + emp.totalMouseClicks;
        return sum + (totalActivity > 0 ? 100 : 0);
      }, 0);
      const averageProductivity = totalEmployees > 0 ? Math.round(totalProductivity / totalEmployees) : 0;

      // Calculate total idle time
      const totalIdleTime = idleTimeSummary.reduce((sum: number, emp: any) => {
        return sum + (emp.totalIdleMinutes || 0);
      }, 0);

      return {
        totalEmployees,
        activeEmployees,
        screenshotsToday,
        averageProductivity,
        totalIdleTime: Math.round(totalIdleTime)
      };
    } catch (error) {
      console.error('Error fetching monitoring summary:', error);
      throw error;
    }
  }

  // Get real-time monitoring data (for live dashboard)
  async getRealTimeMonitoringData(): Promise<any> {
    try {
      const response = await api.get(`${this.baseUrl}/monitoring/realtime`);
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching real-time monitoring data:', error);
      throw error;
    }
  }

  // Download screenshot
  async downloadScreenshot(screenshotId: string): Promise<Blob> {
    try {
      const response = await api.get(`${this.baseUrl}/screenshots/download/${screenshotId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading screenshot:', error);
      throw error;
    }
  }

  // Delete screenshot
  async deleteScreenshot(screenshotId: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/screenshots/${screenshotId}`);
    } catch (error) {
      console.error('Error deleting screenshot:', error);
      throw error;
    }
  }

  // Export monitoring data
  async exportMonitoringData(employeeId: string, startDate: string, endDate: string, format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    try {
      const response = await api.get(`${this.baseUrl}/monitoring/export`, {
        params: {
          employeeId,
          startDate,
          endDate,
          format
        },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting monitoring data:', error);
      throw error;
    }
  }

  // Get monitoring settings
  async getMonitoringSettings(): Promise<any> {
    try {
      const response = await api.get(`${this.baseUrl}/monitoring/settings`);
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching monitoring settings:', error);
      throw error;
    }
  }

  // Update monitoring settings
  async updateMonitoringSettings(settings: any): Promise<void> {
    try {
      await api.put(`${this.baseUrl}/monitoring/settings`, settings);
    } catch (error) {
      console.error('Error updating monitoring settings:', error);
      throw error;
    }
  }
}

export const monitoringService = new MonitoringService();
export default monitoringService;
