import {
  IconChecklist,
  IconLayoutDashboard,
  IconMessages,
  IconUsers,
  IconMicrophone,
  IconUsersGroup,
  IconChartLine,
  IconCalendarCheck,
  IconSettings,
  IconUserCog,
  IconPalette,
  IconNotification,
  IconBrowserCheck,
  IconHelp,
  IconLogout,
  IconBuilding,
  IconClock,
  IconFileText,
  IconActivity,
  IconEye,
} from '@tabler/icons-react'
import { type SidebarData } from '../types'

// This will be dynamically populated from the auth store
export const getSidebarData = (): SidebarData => {
  return {
    user: {
      name: 'Loading...',
      email: 'loading@example.com',
      avatar: '/avatars/shadcn.jpg',
    },
    navGroups: [
      {
        title: 'Main',
        items: [
          {
            title: 'Dashboard',
            url: '/dashboard',
            icon: IconLayoutDashboard,
          },
          {
            title: 'Employee Management',
            url: '/admin-employee-management',
            icon: IconUsers,
          },
          {
            title: 'Tasks',
            icon: IconChecklist,
            items: [
              {
                title: 'All Tasks',
                url: '/tasks',
              },
              {
                title: 'My Tasks',
                url: '/employee-tasks',
              },
            ],
          },
          {
            title: 'Attendance',
            icon: IconCalendarCheck,
            items: [
              {
                title: 'Admin View',
                url: '/admin-attendance',
              },
              {
                title: 'User View',
                url: '/user-attendance',
              },
            ],
          },
        ],
      },
      {
        title: 'Monitoring',
        items: [
          {
            title: 'Activity Monitoring',
            url: '/monitoring',
            icon: IconActivity,
          },
          {
            title: 'Screenshots',
            url: '/recordings',
            icon: IconEye,
          },
          {
            title: 'Time Tracking',
            url: '/monitoring',
            icon: IconClock,
          },
          {
            title: 'Reports',
            url: '/monitoring',
            icon: IconFileText,
          },
        ],
      },
      {
        title: 'Communication',
        items: [
          {
            title: 'Chats',
            url: '/chats',
            badge: '3',
            icon: IconMessages,
          },
          {
            title: 'Meetings',
            url: '/meetings',
            icon: IconUsersGroup,
          },
          {
            title: 'Notifications',
            url: '/settings/notifications',
            icon: IconNotification,
          },
        ],
      },
      {
        title: 'Settings',
        items: [
          {
            title: 'Profile',
            url: '/settings',
            icon: IconUserCog,
          },
          {
            title: 'Account',
            url: '/settings/account',
            icon: IconSettings,
          },
          {
            title: 'Appearance',
            url: '/settings/appearance',
            icon: IconPalette,
          },
          {
            title: 'Display',
            url: '/settings/display',
            icon: IconBrowserCheck,
          },
          {
            title: 'Help Center',
            url: '/help-center',
            icon: IconHelp,
          },
        ],
      },
    ],
  }
}

// Default sidebar data for fallback
export const sidebarData: SidebarData = getSidebarData()