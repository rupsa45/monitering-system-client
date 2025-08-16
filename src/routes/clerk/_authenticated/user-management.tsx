import { createFileRoute } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, Search, Filter } from 'lucide-react'

export const Route = createFileRoute('/clerk/_authenticated/user-management')({
  component: UserManagement,
})

function UserManagement() {
  return (
    <Main>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage users and their permissions in the system.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
            <CardDescription>
              Find specific users or filter by criteria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 border rounded-md"
                  />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              List of all users in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground">
                Start by adding your first user to the system.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Main>
  )
}
