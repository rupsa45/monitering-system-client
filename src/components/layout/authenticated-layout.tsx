import Cookies from 'js-cookie'
import { Outlet } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { PunchInTracker } from '@/components/punch-in-tracker'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import SkipToMain from '@/components/skip-to-main'
import { CommandMenu } from '@/components/command-menu'

interface Props {
  children?: React.ReactNode
}

function AuthenticatedLayoutContent({ children }: Props) {
  return (
    <>
      <SkipToMain />
      <AppSidebar />
      <div
        id='content'
        className={cn(
          'ml-auto w-full max-w-full',
          'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
          'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
          'sm:transition-[width] sm:duration-200 sm:ease-linear',
          'flex h-svh flex-col',
          'group-data-[scroll-locked=1]/body:h-full',
          'has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh'
        )}
      >
        {/* Fixed Header with Punch-in Tracker */}
        <header className='bg-background flex h-16 items-center gap-3 p-4 sm:gap-4 border-b'>
          <div className='flex items-center justify-between w-full'>
            {/* Left side - Punch-in tracker */}
            <div className='flex items-center gap-4 flex-1 min-w-0 mr-6'>
              <PunchInTracker />
            </div>
            
            {/* Right side - Search, theme switch, profile */}
            <div className='flex items-center space-x-4 flex-shrink-0'>
              <Search />
              <ThemeSwitch />
              <ProfileDropdown />
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <div className='flex-1 overflow-auto'>
          {children ? children : <Outlet />}
        </div>
      </div>
    </>
  )
}

export function AuthenticatedLayout({ children }: Props) {
  const defaultOpen = Cookies.get('sidebar_state') !== 'false'

  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AuthenticatedLayoutContent>{children}</AuthenticatedLayoutContent>
        <CommandMenu />
      </SidebarProvider>
    </SearchProvider>
  )
}
