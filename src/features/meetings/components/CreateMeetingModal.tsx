import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMeetingStore } from '@/stores/meetingStore'
import { CreateMeetingRequest } from '@/services/meetingService'
import { validateMeetingData } from '@/utils/meetingUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Calendar, Clock, Users, Lock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

// Form validation schema
const createMeetingSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z.string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  type: z.enum(['BASIC', 'NORMAL', 'LONG']),
  scheduledStart: z.string().min(1, 'Start time is required'),
  scheduledEnd: z.string().min(1, 'End time is required'),
  password: z.string()
    .min(4, 'Password must be at least 4 characters')
    .max(20, 'Password cannot exceed 20 characters')
    .optional(),
  isPersistent: z.boolean().default(false),
  participants: z.array(z.string()).default([])
})

type CreateMeetingFormData = z.infer<typeof createMeetingSchema>

interface CreateMeetingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole?: 'admin' | 'employee'
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  open,
  onOpenChange,
  userRole = 'employee'
}) => {
  const { creating, createMeeting, toggleCreateModal } = useMeetingStore()
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<CreateMeetingFormData>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: {
      type: 'NORMAL',
      isPersistent: false,
      participants: []
    }
  })

  const watchedValues = watch()

  // Handle form submission
  const onSubmit = async (data: CreateMeetingFormData) => {
    try {
      // Additional validation
      const validation = validateMeetingData(data)
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        return
      }

      setValidationErrors([])

      // Prepare meeting data
      const meetingData: CreateMeetingRequest = {
        title: data.title,
        description: data.description,
        type: data.type,
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        password: data.password,
        isPersistent: data.isPersistent,
        participants: data.participants
      }

      // Create meeting
      const success = await createMeeting(meetingData)
      
      if (success) {
        toast.success('Meeting created successfully!')
        handleClose()
      } else {
        toast.error('Failed to create meeting. Please try again.')
      }
    } catch (error) {
      // Error creating meeting
      toast.error('An unexpected error occurred. Please try again.')
    }
  }

  // Handle modal close
  const handleClose = () => {
    reset()
    setValidationErrors([])
    toggleCreateModal(false)
  }

  // Get minimum start time (5 minutes from now)
  const getMinStartTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 5)
    return now.toISOString().slice(0, 16)
  }

  // Get minimum end time (15 minutes after start)
  const getMinEndTime = () => {
    const startTime = watchedValues.scheduledStart
    if (!startTime) return ''
    
    const start = new Date(startTime)
    start.setMinutes(start.getMinutes() + 15)
    return start.toISOString().slice(0, 16)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Create New Meeting
          </DialogTitle>
          <DialogDescription>
            Schedule a new meeting with your team. Fill in the details below to get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <div className="text-red-600">
                  <div className="font-medium">Please fix the following errors:</div>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Meeting Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              placeholder="Enter meeting title"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Meeting Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter meeting description (optional)"
              {...register('description')}
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Meeting Type and Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Meeting Type *</Label>
              <Select
                value={watchedValues.type}
                onValueChange={(value) => setValue('type', value as 'BASIC' | 'NORMAL' | 'LONG')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">Basic Meeting</SelectItem>
                  <SelectItem value="NORMAL">Normal Meeting</SelectItem>
                  <SelectItem value="LONG">Long Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isPersistent">Meeting Settings</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPersistent"
                  checked={watchedValues.isPersistent}
                  onCheckedChange={(checked) => setValue('isPersistent', checked as boolean)}
                />
                <Label htmlFor="isPersistent" className="text-sm">
                  Persistent Meeting
                </Label>
              </div>
              <p className="text-xs text-gray-500">
                Persistent meetings remain available after the scheduled end time
              </p>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledStart">Start Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="scheduledStart"
                  type="datetime-local"
                  min={getMinStartTime()}
                  {...register('scheduledStart')}
                  className={`pl-10 ${errors.scheduledStart ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.scheduledStart && (
                <p className="text-sm text-red-600">{errors.scheduledStart.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledEnd">End Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="scheduledEnd"
                  type="datetime-local"
                  min={getMinEndTime()}
                  {...register('scheduledEnd')}
                  className={`pl-10 ${errors.scheduledEnd ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.scheduledEnd && (
                <p className="text-sm text-red-600">{errors.scheduledEnd.message}</p>
              )}
            </div>
          </div>

          {/* Password Protection */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              Meeting Password (Optional)
            </Label>
            <Input
              id="password"
              type="text"
              placeholder="Enter meeting password"
              {...register('password')}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Leave empty for no password protection
            </p>
          </div>

          {/* Participants (Admin Only) */}
          {userRole === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="participants" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Invite Participants
              </Label>
              <Textarea
                id="participants"
                placeholder="Enter employee IDs separated by commas (e.g., emp1, emp2, emp3)"
                rows={2}
                {...register('participants')}
              />
              <p className="text-xs text-gray-500">
                Enter employee IDs separated by commas to automatically invite participants
              </p>
            </div>
          )}

          {/* Meeting Type Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Meeting Type Information:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>Basic:</strong> Quick meetings up to 30 minutes</div>
              <div><strong>Normal:</strong> Standard meetings up to 2 hours</div>
              <div><strong>Long:</strong> Extended meetings up to 4 hours</div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Meeting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
