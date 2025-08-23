import { createFileRoute } from '@tanstack/react-router'
import { MeetingDetails } from '@/features/meetings/components/MeetingDetails'

export const Route = createFileRoute('/_authenticated/meetings/$meetingId')({
  component: MeetingDetails,
})





