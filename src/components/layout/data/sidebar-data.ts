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
  const { auth } = useAuthStore.getState()
  const isAdmin = auth.user?.empRole === 'admin'
  const isEmployee = auth.user?.empRole === 'employee'
  
  // Admin-specific navigation
  const adminNavGroups = [
    {
      title: 'Main',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Employee Management',
          url: '/admin-employee-management',
          icon: IconUsers,
        },
        {
          title: 'All Tasks',
          url: '/tasks',
          icon: IconChecklist,
        },
        {
          title: 'Attendance',
          url: '/admin-attendance',
          icon: IconCalendarCheck,
        },
        {
          title: 'Leave Management',
          url: '/admin-leave-management',
          icon: IconCalendarCheck,
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
  ]

  // Employee-specific navigation
  const employeeNavGroups = [
    {
      title: 'Main',
      items: [
        {
          title: 'My Tasks',
          url: '/employee-tasks',
          icon: IconChecklist,
        },
        {
          title: 'My Attendance',
          url: '/user-attendance',
          icon: IconCalendarCheck,
        },
        {
          title: 'My Leave Management',
          url: '/employee-leave-management',
          icon: IconCalendarCheck,
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
          title: 'Appearance',
          url: '/settings/appearance',
          icon: IconPalette,
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ]

  return {
    user: {
      name: auth.user?.empName || 'Loading...',
      email: auth.user?.empEmail || 'loading@example.com',
      avatar: auth.user?.empProfile || '/avatars/shadcn.jpg',
    },
    navGroups: isAdmin ? adminNavGroups : employeeNavGroups,
  }
}

// Default sidebar data for fallback
export const sidebarData: SidebarData = getSidebarData()