import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { AuthService } from '@/services/authService'

const formSchema = z.object({
  empEmail: z.string().email('Please enter a valid email address'),
  empPassword: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof formSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' })
  const { auth } = useAuthStore()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      empEmail: '',
      empPassword: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      console.log('Attempting login with:', data.empEmail)
      
      const result = await AuthService.login(data)
      console.log('Login result:', result)
      
      if (result.success && result.accessToken) {
        // Set access token
        auth.setAccessToken(result.accessToken)
        console.log('Access token set successfully')
        
        try {
          // Fetch user profile
          const profileResult = await AuthService.getUserProfile(result.accessToken)
          console.log('Profile result:', profileResult)
          
          if (profileResult.success && profileResult.data) {
            const user = {
              id: profileResult.data.id,
              empId: profileResult.data.empId.toString(),
              empName: profileResult.data.empName,
              empEmail: profileResult.data.empEmail,
              empPhone: profileResult.data.empPhone,
              empRole: profileResult.data.empRole,
              empTechnology: profileResult.data.empTechnology,
              empProfile: profileResult.data.empProfile,
              empGender: profileResult.data.empGender,
              isActive: profileResult.data.isActive,
              createdAt: profileResult.data.createdAt,
              updatedAt: profileResult.data.updatedAt,
            }
            auth.setUser(user)
            console.log('User profile set successfully:', user)
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError)
          // Fallback to login response data
          const user = {
            id: result.user?.empId?.toString() || '',
            empId: result.user?.empId?.toString() || '',
            empName: result.user?.empName || '',
            empEmail: result.user?.empEmail || data.empEmail,
            empPhone: '',
            empRole: result.user?.empRole || 'employee',
            empTechnology: result.user?.empTechnology || '',
            empProfile: '',
            empGender: result.user?.empGender || '',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          auth.setUser(user)
          console.log('Fallback user data set:', user)
        }
        
        toast.success(result.message || 'Login successful!')
        
        // Debug logging
        console.log('Login successful, user:', auth.user)
        console.log('Access token set:', !!auth.accessToken)
        console.log('Redirecting to:', search.redirect || '/')
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          // Redirect based on user role
          const userRole = auth.user?.empRole
          let redirectTo = '/user-attendance'
          
          if (userRole === 'admin') {
            redirectTo = '/'
          } else if (userRole === 'employee') {
            // Employees should go to their employee dashboard
            redirectTo = '/employee-dashboard'
          }
          
          console.log('User role:', userRole, 'Navigating to:', redirectTo)
          navigate({ to: redirectTo as any })
        }, 100)
      } else {
        console.error('Login failed:', result.message)
        toast.error(result.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred during login. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <img
                src="/images/tellis_logo_2.png"
                alt="Tellis Logo"
                className="h-12 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>
              Enter your email and password below to log into your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                 <FormField
                   control={form.control}
                   name="empEmail"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Email</FormLabel>
                       <FormControl>
                         <Input
                           placeholder="name@example.com"
                           type="email"
                           {...field}
                           className="h-11"
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                
                <FormField
                  control={form.control}
                  name="empPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter your password"
                            type={showPassword ? "text" : "password"}
                            {...field}
                            className="h-11 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <IconEyeOff className="h-4 w-4" />
                            ) : (
                              <IconEye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          
                     <CardFooter className="flex flex-col space-y-2">
             <p className="text-center text-xs text-muted-foreground">
               By signing in, you agree to our Terms of Service and Privacy Policy
             </p>
           </CardFooter>
        </Card>
      </div>
    </div>
  )
}
