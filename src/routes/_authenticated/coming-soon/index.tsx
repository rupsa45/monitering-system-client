import { createFileRoute } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Construction, ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/coming-soon/')({
  component: ComingSoon,
})

function ComingSoon() {
  return (
    <Main>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Construction className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Coming Soon</CardTitle>
            <CardDescription>
              This feature is currently under development. We're working hard to bring you something amazing!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/_authenticated">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Main>
  )
} 