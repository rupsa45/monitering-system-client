import { createFileRoute } from '@tanstack/react-router'
import Meetings from '@/features/meetings'

export const Route = createFileRoute('/_authenticated/meetings/')({
  component: Meetings,
}) 