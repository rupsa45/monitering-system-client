import { createFileRoute } from '@tanstack/react-router'
import { MeetingRoom } from '@/features/meetings/components/MeetingRoom'

export const Route = createFileRoute('/_authenticated/meetings/room')({
  component: MeetingRoom,
})





