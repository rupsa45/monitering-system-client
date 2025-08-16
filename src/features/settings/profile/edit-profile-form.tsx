import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/stores/authStore'
import { AuthService } from '@/services/authService'
import { toast } from 'sonner'
import { Building, Phone, Save, X } from 'lucide-react'

interface EditProfileFormProps {
  currentProfile: {
    empId: number
    empTechnology: string
    empPhone: string
  }
  onClose: () => void
  onSuccess: () => void
}

const TECHNOLOGY_OPTIONS = [
  'React',
  'Node.js',
  'Python',
  'Java',
  'C#',
  'PHP',
  'Angular',
  'Vue.js',
  'TypeScript',
  'JavaScript',
  'Go',
  'Ruby',
  'Swift',
  'Kotlin',
  'Flutter',
  'React Native',
  'Other'
]

export function EditProfileForm({ currentProfile, onClose, onSuccess }: EditProfileFormProps) {
  const { accessToken, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    empTechnology: currentProfile.empTechnology || '',
    empPhone: currentProfile.empPhone || ''
  })

  // Debug logging to help identify issues
  console.log('EditProfileForm - User data:', user)
  console.log('EditProfileForm - Current profile:', currentProfile)
  console.log('EditProfileForm - Access token:', accessToken ? 'Available' : 'Not available')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Use empId from currentProfile as fallback if user data is not available
    const empId = user?.empId || currentProfile.empId
    
    if (!empId) {
      toast.error('User ID not found')
      return
    }

    setLoading(true)
    try {
      const response = await AuthService.updateEmployeeProfile(accessToken, empId, {
        empTechnology: formData.empTechnology,
        empPhone: parseInt(formData.empPhone) || undefined
      })

      if (response.success) {
        toast.success('Profile updated successfully!')
        onSuccess()
        onClose()
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone)
  }

  const isFormValid = () => {
    return (
      formData.empTechnology.trim().length >= 2 &&
      formData.empPhone.trim().length === 10 &&
      validatePhone(formData.empPhone)
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Edit Profile
        </CardTitle>
        <CardDescription>
          Update your technology and phone number. Only these fields can be modified.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="empTechnology">Technology</Label>
            <Select
              value={formData.empTechnology}
              onValueChange={(value) => handleInputChange('empTechnology', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your technology" />
              </SelectTrigger>
              <SelectContent>
                {TECHNOLOGY_OPTIONS.map((tech) => (
                  <SelectItem key={tech} value={tech}>
                    {tech}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.empTechnology && formData.empTechnology.trim().length < 2 && (
              <p className="text-sm text-red-500">Technology must be at least 2 characters</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="empPhone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="empPhone"
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={formData.empPhone}
                onChange={(e) => handleInputChange('empPhone', e.target.value.replace(/\D/g, ''))}
                className="pl-10"
                maxLength={10}
              />
            </div>
            {formData.empPhone && !validatePhone(formData.empPhone) && (
              <p className="text-sm text-red-500">Please enter a valid 10-digit phone number</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !isFormValid()}
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
