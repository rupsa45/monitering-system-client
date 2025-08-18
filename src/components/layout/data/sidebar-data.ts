import {
  IconChecklist,
  IconLayoutDashboard,
  IconMessages,
  IconUsers,
  IconUsersGroup,
  IconCalendarCheck,
  IconSettings,
  IconUserCog,
  IconPalette,
  IconNotification,
  IconBrowserCheck,
  IconHelp,
  IconActivity,
  IconEye,
} from '@tabler/icons-react'
import { type SidebarData } from '../types'
import { useAuthStore } from '@/stores/authStore'

// This will be dynamically populated from the auth store
export const getSidebarData = (): SidebarData => {
  const { user } = useAuthStore.getState()
  const isAdmin = user?.empRole === 'admin'
  
  return {
    user: {
      name: user?.empName || 'Loading...',
      email: user?.empEmail || 'loading@example.com',
      avatar: user?.empProfile || '/avatars/shadcn.jpg',
    },
    navGroups: [
      {
        title: 'Main',
        items: [
          ...(isAdmin ? [{
            title: 'Dashboard',
            url: '/',
            icon: IconLayoutDashboard,
          }] : []),
          ...(isAdmin ? [{
            title: 'Employee Management',
            url: '/admin-employee-management',
            icon: IconUsers,
          }] : []),
          ...(!isAdmin ? [{
            title: 'My Dashboard',
            url: '/employee-dashboard',
            icon: IconLayoutDashboard,
          }] : []),
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