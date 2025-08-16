import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Main } from '@/components/layout/main'
import { useAuth } from '@/stores/authStore'
import { AuthService } from '@/services/authService'
import { toast } from 'sonner'
import { User, Mail, Phone, Code, Calendar, Save, Edit } from 'lucide-react'

interface ProfileFormData {
  empTechnology: string
  empPhone: string
}

export default function ProfileSettings() {
  const { user, accessToken, setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    empTechnology: '',
    empPhone: '',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        empTechnology: user.empTechnology || '',
        empPhone: user.empPhone || '',
      })
    }
  }, [user])

  const handleSave = async () => {
    if (!user?.id || !accessToken) return

    setLoading(true)
    try {
      const response = await AuthService.updateEmployeeProfile(accessToken, user.id, {
        empTechnology: formData.empTechnology,
        empPhone: formData.empPhone,
      })

      if (response.success && response.employee) {
        // Update user data in store
        setUser({
          ...user,
          empTechnology: response.employee.empTechnology,
          empPhone: response.employee.empPhone,
        })
        
        toast.success('Profile updated successfully')
        setEditing(false)
      } else {
        toast.error(response.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to current user data
    if (user) {
      setFormData({
        empTechnology: user.empTechnology || '',
        empPhone: user.empPhone || '',
      })
    }
    setEditing(false)
  }

  if (!user) {
  return (
      <Main>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading profile...</div>
        </div>
      </Main>
    )
  }

  // Generate initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <Main>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and profile information.
          </p>
        </div>

        {/* Profile Information */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Profile Information</CardTitle>
                  <CardDescription className="text-base">
                    Your personal information and account details.
                  </CardDescription>
                </div>
                <Button
                  variant={editing ? "outline" : "default"}
                  onClick={() => setEditing(!editing)}
                  className="shrink-0"
                >
                  {editing ? (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Cancel Edit
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center text-center mb-8">
                <Avatar className="h-24 w-24 mb-4 ring-4 ring-blue-100 dark:ring-blue-900">
                  <AvatarImage src={user.empProfile || ''} alt={user.empName} />
                  <AvatarFallback className="text-2xl font-semibold">
                    {getInitials(user.empName)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-2xl font-bold mb-2">{user.empName}</h3>
                <p className="text-muted-foreground mb-3">{user.empEmail}</p>
                <Badge variant="secondary" className="text-sm px-3 py-1 capitalize">
                  {user.empRole}
                </Badge>
              </div>

              {/* Editable Fields */}
              <div className="max-w-md mx-auto space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="technology" className="text-sm font-medium">Technology</Label>
                  {editing ? (
                    <Input
                      id="technology"
                      value={formData.empTechnology}
                      onChange={(e) => setFormData(prev => ({ ...prev, empTechnology: e.target.value }))}
                      placeholder="Enter your technology"
                      className="h-11"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Code className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{user.empTechnology || 'Not specified'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  {editing ? (
                    <Input
                      id="phone"
                      value={formData.empPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, empPhone: e.target.value }))}
                      placeholder="Enter your phone number"
                      className="h-11"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Phone className="h-5 w-5 text-green-600" />
                      <span className="font-medium">{user.empPhone || 'Not specified'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {editing && (
                <div className="flex justify-center space-x-3 pt-6 border-t mt-8">
                  <Button onClick={handleSave} disabled={loading} className="px-8">
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} className="px-8">
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
              <CardTitle className="text-2xl">Account Statistics</CardTitle>
              <CardDescription className="text-base">
                Overview of your account activity and performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-6 border rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {user.isActive ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Status</div>
                </div>
                <div className="text-center p-6 border rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {user.empRole === 'admin' ? 'Admin' : 'Employee'}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Role</div>
                </div>
                <div className="text-center p-6 border rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {user.statistics?.totalTasks || 0}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Total Tasks</div>
                </div>
                <div className="text-center p-6 border rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {user.statistics?.totalTimeSheets || 0}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Time Sheets</div>
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Employee ID</span>
                  </div>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {user.id || user.empId || 'Not available'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Mail className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="font-medium">Email</span>
                  </div>
                  <span className="text-sm font-medium">{user.empEmail}</span>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-medium">Member Since</span>
                  </div>
                  <span className="text-sm font-medium">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>

                {/* Additional Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <Code className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="font-medium">Completed Tasks</span>
                    </div>
                    <span className="text-sm font-medium">
                      {user.statistics?.completedTasks || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                        <Calendar className="h-4 w-4 text-teal-600" />
                      </div>
                      <span className="font-medium">Total Leaves</span>
                    </div>
                    <span className="text-sm font-medium">
                      {user.statistics?.totalLeaves || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                        <User className="h-4 w-4 text-pink-600" />
                      </div>
                      <span className="font-medium">Completion Rate</span>
                    </div>
                    <span className="text-sm font-medium">
                      {(user.statistics?.completionRate || 0)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <Phone className="h-4 w-4 text-amber-600" />
                      </div>
                      <span className="font-medium">Gender</span>
                    </div>
                    <span className="text-sm font-medium capitalize">
                      {user.empGender?.toLowerCase() || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Main>
  )
}