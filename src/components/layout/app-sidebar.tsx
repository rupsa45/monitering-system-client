import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { getSidebarData } from './data/sidebar-data'
import { useAuth } from '@/stores/authStore'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar()
  const { user } = useAuth()
  const isCollapsed = state === 'collapsed'

  // Get dynamic sidebar data
  const sidebarData = getSidebarData()
  
  // Update user data with auth store data if available
  const userData = {
    name: user?.empName || sidebarData.user.name,
    email: user?.empEmail || sidebarData.user.email,
    avatar: user?.empProfile || sidebarData.user.avatar,
  }

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <div className='flex items-center gap-2 px-2 py-2'>
          <div className={`flex items-center justify-center rounded-lg overflow-hidden ${
            isCollapsed ? 'size-12 mx-auto' : 'aspect-square size-8'
          }`}>
            <img 
              src="/images/tellis_logo_2.png" 
              alt="Tellis Technology" 
              className={isCollapsed ? 'w-10 h-10 object-contain' : 'w-full h-full object-contain'}
            />
          </div>
          {!isCollapsed && (
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-semibold'>Tellis Technology</span>
              <span className='truncate text-xs'>Go Digital</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
