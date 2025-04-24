"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen } from "lucide-react"

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SOP Manager</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Error</CardTitle>
          <CardDescription className="text-center">Sorry, something went wrong</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p>There was an error processing your request. Please try again or contact support if the issue persists.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login">
            <Button>Return to Login</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
