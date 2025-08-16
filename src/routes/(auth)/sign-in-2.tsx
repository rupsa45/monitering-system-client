import { createFileRoute } from '@tanstack/react-router'
import LoginPage from '@/features/auth/login'

export const Route = createFileRoute('/(auth)/sign-in-2')({
  component: LoginPage,
})
