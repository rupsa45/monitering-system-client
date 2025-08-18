import { Shield, AlertTriangle, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@tanstack/react-router'

interface AccessDeniedProps {
  title?: string
  message?: string
  showHomeButton?: boolean
}

export function AccessDenied({ 
  title = "Access Denied", 
  message = "This page is only available for administrators.",
  showHomeButton = true 
}: AccessDeniedProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-destructive">{title}</CardTitle>
          <CardDescription className="text-base">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Please contact your administrator if you need access.
          </div>
          
          {showHomeButton && (
            <Button asChild className="w-full">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
