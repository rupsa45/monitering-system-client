import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMeetingStore } from '@/stores/meetingStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Video, Lock, Hash, AlertCircle, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

// Form validation schema
const joinMeetingSchema = z.object({
  roomCode: z.string()
    .min(1, 'Room code is required')
    .regex(/^[A-Z0-9]+$/, 'Room code must contain only uppercase letters and numbers'),
  password: z.string().optional(),
  timeSheetId: z.string().optional()
})

type JoinMeetingFormData = z.infer<typeof joinMeetingSchema>

interface JoinMeetingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const JoinMeetingModal: React.FC<JoinMeetingModalProps> = ({
  open,
  onOpenChange
}) => {
  const { joining, joinMeeting, toggleJoinModal } = useMeetingStore()
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<JoinMeetingFormData>({
    resolver: zodResolver(joinMeetingSchema)
  })

  const watchedValues = watch()

  // Handle form submission
  const onSubmit = async (data: JoinMeetingFormData) => {
    try {
      // Join meeting
      const success = await joinMeeting(data.roomCode, {
        password: data.password,
        timeSheetId: data.timeSheetId
      })
      
      if (success) {
        toast.success('Successfully joined meeting!')
        handleClose()
      } else {
        toast.error('Failed to join meeting. Please check your room code and password.')
      }
    } catch (_error) {
      // Error joining meeting
      toast.error('An unexpected error occurred. Please try again.')
    }
  }

  // Handle modal close
  const handleClose = () => {
    reset()
    setShowPassword(false)
    setCopied(false)
    toggleJoinModal(false)
  }

  // Handle room code copy
  const handleCopyRoomCode = () => {
    if (watchedValues.roomCode) {
      navigator.clipboard.writeText(watchedValues.roomCode)
      setCopied(true)
      toast.success('Room code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Handle room code paste
  const handlePasteRoomCode = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && /^[A-Z0-9]+$/.test(text)) {
        setValue('roomCode', text)
        toast.success('Room code pasted from clipboard!')
      } else {
        toast.error('Invalid room code format in clipboard')
      }
    } catch (error) {
      toast.error('Failed to paste from clipboard')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Join Meeting
          </DialogTitle>
          <DialogDescription>
            Enter the meeting room code to join. You may need a password if the meeting is protected.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Room Code */}
          <div className="space-y-2">
            <Label htmlFor="roomCode" className="flex items-center">
              <Hash className="h-4 w-4 mr-2" />
              Room Code *
            </Label>
            <div className="relative">
              <Input
                id="roomCode"
                placeholder="Enter room code (e.g., ABC123)"
                {...register('roomCode')}
                className={`pr-20 ${errors.roomCode ? 'border-red-500' : ''}`}
                autoComplete="off"
                autoFocus
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyRoomCode}
                  disabled={!watchedValues.roomCode}
                  className="h-6 w-6 p-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePasteRoomCode}
                  className="h-6 px-2 text-xs"
                >
                  Paste
                </Button>
              </div>
            </div>
            {errors.roomCode && (
              <p className="text-sm text-red-600">{errors.roomCode.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Room codes are typically 6 characters long and contain letters and numbers
            </p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              Meeting Password (if required)
            </Label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter meeting password"
              {...register('password')}
              className={errors.password ? 'border-red-500' : ''}
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showPassword"
                checked={showPassword}
                onCheckedChange={(checked) => setShowPassword(checked as boolean)}
              />
              <Label htmlFor="showPassword" className="text-sm">
                Show password
              </Label>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Time Sheet ID (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="timeSheetId">Time Sheet ID (Optional)</Label>
            <Input
              id="timeSheetId"
              placeholder="Enter your time sheet ID"
              {...register('timeSheetId')}
            />
            <p className="text-xs text-gray-500">
              If you have an active time sheet, enter its ID to link it with the meeting
            </p>
          </div>

          {/* Help Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">Need help joining?</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check with the meeting host for the correct room code</li>
                  <li>Ensure you have the meeting password if required</li>
                  <li>Make sure your microphone and camera are working</li>
                  <li>Use a supported browser (Chrome, Firefox, Safari, Edge)</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={joining}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={joining || !watchedValues.roomCode}
            >
              {joining ? 'Joining...' : 'Join Meeting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
