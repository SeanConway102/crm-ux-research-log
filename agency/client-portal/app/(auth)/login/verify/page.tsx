import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"

export default function VerifyRequestPage() {
  return (
    <Card>
      <CardHeader>
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-muted p-3">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <CardTitle className="text-center">Check your email</CardTitle>
        <CardDescription className="text-center">
          A sign-in link has been sent to your email address. Click the link in the email to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-sm text-muted-foreground">
          The link expires in 1 hour. If you don&apos;t see it, check your spam folder.
        </p>
      </CardContent>
    </Card>
  )
}
