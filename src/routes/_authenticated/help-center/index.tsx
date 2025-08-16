import { createFileRoute } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HelpCircle, Mail, MessageCircle, BookOpen, ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/help-center/')({
  component: HelpCenter,
})

function HelpCenter() {
  return (
    <Main>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
            <p className="text-muted-foreground">
              Get help and support for using the Employee Monitoring System.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/_authenticated">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Help Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <CardTitle>Documentation</CardTitle>
              </div>
              <CardDescription>
                Read our comprehensive guides and tutorials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Documentation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <CardTitle>Live Chat</CardTitle>
              </div>
              <CardDescription>
                Chat with our support team in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-purple-600" />
                <CardTitle>Email Support</CardTitle>
              </div>
              <CardDescription>
                Send us an email and we'll get back to you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Send Email
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Find answers to common questions about the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">How do I punch in/out?</h3>
                <p className="text-sm text-muted-foreground">
                  Use the punch-in tracker in the header or navigate to the attendance section to manage your time tracking.
                </p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">How do I request leave?</h3>
                <p className="text-sm text-muted-foreground">
                  Navigate to the leave management section to submit and track your leave requests.
                </p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">How do I update my profile?</h3>
                <p className="text-sm text-muted-foreground">
                  Go to Settings → Profile to view and update your personal information.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">How do I view my tasks?</h3>
                <p className="text-sm text-muted-foreground">
                  Navigate to the Tasks section to view and manage your assigned tasks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Main>
  )
}
