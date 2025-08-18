import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Main } from '@/components/layout/main'
import { useAuth } from '@/stores/authStore'
import { EmployeeService, Employee } from '@/services/employeeService'
import { CreateEmployeeForm } from './components/create-employee-form'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  Loader2
} from 'lucide-react'

export default function AdminEmployeeManagement() {
  const { accessToken, user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Check if user is admin
  if (!user) {
    return (
      <Main>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">User Not Found</h1>
            <p className="text-muted-foreground">
              Please log in to access this page.
            </p>
          </div>
        </div>
      </Main>
    )
  }

  if (user?.empRole !== 'admin') {
    return (
      <Main>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </Main>
    )
  }

  useEffect(() => {
    console.log('AdminEmployeeManagement useEffect - accessToken:', accessToken)
    console.log('AdminEmployeeManagement useEffect - user:', user)
    
    if (accessToken) {
      fetchEmployees()
    } else {
      console.log('No access token found, setting loading to false')
      setLoading(false)
    }
  }, [accessToken])

  const fetchEmployees = async () => {
    try {
      console.log('fetchEmployees - Starting to fetch employees')
      setLoading(true)
      const response = await EmployeeService.getAllEmployees(accessToken)
      console.log('fetchEmployees - Response:', response)
      if (response.success) {
        setEmployees(response.data)
      } else {
        toast.error(response.message || 'Failed to load employees')
      }
    } catch (error) {
      console.error('fetchEmployees - Error:', error)
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeCreated = () => {
    fetchEmployees() // Refresh the list after creating an employee
  }

  const filteredEmployees = employees.filter(employee =>
    employee.empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.empEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.empTechnology.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <Main>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading employees...</span>
          </div>
        </div>
      </Main>
    )
  }

  return (
    <Main>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
            <p className="text-muted-foreground">
              Manage your organization's employees and their information.
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
            <CardDescription>
              Find specific employees or filter by criteria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
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

        {/* Employees List */}
        <Card>
          <CardHeader>
            <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
            <CardDescription>
              List of all employees in your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="" alt={employee.empName} />
                      <AvatarFallback>
                        {employee.empName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{employee.empName}</h3>
                      <p className="text-sm text-muted-foreground">{employee.empEmail}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{employee.empTechnology}</Badge>
                        <Badge variant={employee.isActive ? "default" : "destructive"}>
                          {employee.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredEmployees.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No employees found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Create Employee Form */}
      <CreateEmployeeForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={handleEmployeeCreated}
      />
    </Main>
  )
}

