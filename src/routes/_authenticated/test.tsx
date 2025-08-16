import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/test')({
  component: () => <div>Test Route Working!</div>,
})
