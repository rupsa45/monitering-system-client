import { createFileRoute } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/clerk/(auth)')({
  component: AuthRoute,
})

function AuthRoute() {
  return (
    <Main>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Shield className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Authentication Required</CardTitle>
            <CardDescription>
              You need to be authenticated to access this page. Please sign in to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/sign-in">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Sign In
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Main>
  )
}
