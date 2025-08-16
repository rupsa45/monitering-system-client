import { createFileRoute } from '@tanstack/react-router'
import Recordings from '@/features/recordings'

export const Route = createFileRoute('/_authenticated/recordings/')({
  component: Recordings,
}) 