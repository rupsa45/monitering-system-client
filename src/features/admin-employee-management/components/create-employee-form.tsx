import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/stores/authStore'
import { EmployeeService, CreateEmployeeData } from '@/services/employeeService'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface CreateEmployeeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateEmployeeForm({ open, onOpenChange, onSuccess }: CreateEmployeeFormProps) {
  const { accessToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Omit<CreateEmployeeData, 'empPhone'> & { empPhone: string }>({
    empName: '',
    empEmail: '',
    empPhone: '',
    empPassword: '',
    confirmPassword: '',
    empTechnology: '',
    empGender: 'MALE'
  })

  const handleInputChange = (field: keyof CreateEmployeeData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): string | null => {
    if (!formData.empName.trim()) return 'Employee name is required'
    if (!formData.empEmail.trim()) return 'Email is required'
    if (!formData.empPhone.trim()) return 'Phone number is required'
    if (!formData.empPassword) return 'Password is required'
    if (formData.empPassword.length < 8) return 'Password must be at least 8 characters'
    
    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    if (!passwordRegex.test(formData.empPassword)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
    
    if (formData.empPassword !== formData.confirmPassword) return 'Passwords do not match'
    if (!formData.empTechnology.trim()) return 'Technology is required'
    if (!formData.empGender) return 'Gender is required'
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.empEmail)) return 'Please enter a valid email address'
    
    // Phone validation (basic)
    const phoneRegex = /^\d{10}$/
    const cleanPhone = formData.empPhone.replace(/\D/g, '')
    if (!phoneRegex.test(cleanPhone)) return 'Please enter a valid 10-digit phone number'
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    if (!accessToken) {
      toast.error('Authentication required')
      return
    }

    setLoading(true)
    try {
      // Convert phone to number for backend validation
      const employeeData = {
        ...formData,
        empPhone: parseInt(formData.empPhone.replace(/\D/g, ''), 10)
      }
      const response = await EmployeeService.createEmployee(accessToken, employeeData)
      if (response.success) {
        toast.success('Employee created successfully!')
        onSuccess()
        onOpenChange(false)
        // Reset form
        setFormData({
          empName: '',
          empEmail: '',
          empPhone: '',
          empPassword: '',
          confirmPassword: '',
          empTechnology: '',
          empGender: 'MALE'
        })
      } else {
        toast.error(response.message || 'Failed to create employee')
      }
    } catch (error) {
      console.error('Error creating employee:', error)
      toast.error('Failed to create employee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Employee</DialogTitle>
          <DialogDescription>
            Add a new employee to your organization. Fill in all the required fields.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="empName">Full Name *</Label>
              <Input
                id="empName"
                value={formData.empName}
                onChange={(e) => handleInputChange('empName', e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="empEmail">Email *</Label>
              <Input
                id="empEmail"
                type="email"
                value={formData.empEmail}
                onChange={(e) => handleInputChange('empEmail', e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="empPhone">Phone Number *</Label>
              <Input
                id="empPhone"
                value={formData.empPhone}
                onChange={(e) => handleInputChange('empPhone', e.target.value)}
                placeholder="Enter phone number"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="empGender">Gender *</Label>
              <Select value={formData.empGender} onValueChange={(value) => handleInputChange('empGender', value as 'MALE' | 'FEMALE')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="empTechnology">Technology *</Label>
            <Input
              id="empTechnology"
              value={formData.empTechnology}
              onChange={(e) => handleInputChange('empTechnology', e.target.value)}
              placeholder="e.g., React, Node.js, Python"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="empPassword">Password *</Label>
              <Input
                id="empPassword"
                type="password"
                value={formData.empPassword}
                onChange={(e) => handleInputChange('empPassword', e.target.value)}
                placeholder="Enter password"
                required
              />
              <p className="text-xs text-muted-foreground">
                Must contain at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm password"
                required
              />
              <p className="text-xs text-muted-foreground">
                Must match the password above
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Employee'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
