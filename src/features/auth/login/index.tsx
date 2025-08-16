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
      // Use AuthService for login
      const result = await AuthService.login(data)
      
      if (result.success) {
        // Store authentication data
        auth.setAccessToken(result.accessToken)
        
        // Fetch complete user profile data
        try {
          const profileResponse = await AuthService.getUserProfile(result.accessToken)
          if (profileResponse.success && profileResponse.data) {
            auth.setUser(profileResponse.data)
          } else {
            // Fallback to login response data if profile fetch fails
            const user = {
              id: result.user?.empId?.toString() || result.user?.id?.toString() || '',
              empId: result.user?.empId?.toString() || result.user?.id?.toString() || '',
              empName: result.user?.empName || '',
              empEmail: result.user?.empEmail || data.empEmail,
              empPhone: result.user?.empPhone || '',
              empRole: result.user?.empRole || 'employee',
              empTechnology: result.user?.empTechnology || '',
              empProfile: result.user?.empProfile || '',
              empGender: result.user?.empGender || '',
              isActive: result.user?.isActive !== undefined ? result.user.isActive : true,
              createdAt: result.user?.createdAt || new Date().toISOString(),
              updatedAt: result.user?.updatedAt || new Date().toISOString(),
            }
            auth.setUser(user)
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError)
          // Fallback to login response data
          const user = {
            id: result.user?.empId?.toString() || result.user?.id?.toString() || '',
            empId: result.user?.empId?.toString() || result.user?.id?.toString() || '',
            empName: result.user?.empName || '',
            empEmail: result.user?.empEmail || data.empEmail,
            empPhone: result.user?.empPhone || '',
            empRole: result.user?.empRole || 'employee',
            empTechnology: result.user?.empTechnology || '',
            empProfile: result.user?.empProfile || '',
            empGender: result.user?.empGender || '',
            isActive: result.user?.isActive !== undefined ? result.user.isActive : true,
            createdAt: result.user?.createdAt || new Date().toISOString(),
            updatedAt: result.user?.updatedAt || new Date().toISOString(),
          }
          auth.setUser(user)
        }
        
        toast.success(result.message || 'Login successful!')
        
        // Redirect to dashboard or intended page
        const redirectTo = search.redirect || '/'
        navigate({ to: redirectTo as any })
      } else {
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
               By signing in, you agree to our{' '}
               <Link to="/terms" className="hover:text-primary underline">
                 Terms of Service
               </Link>{' '}
               and{' '}
               <Link to="/privacy" className="hover:text-primary underline">
                 Privacy Policy
               </Link>
             </p>
           </CardFooter>
        </Card>
      </div>
    </div>
  )
}
