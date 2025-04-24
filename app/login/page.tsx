"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { login } from "./actions"
import toast from "react-hot-toast"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append("email", email)
    formData.append("password", password)

    // Show loading toast
    const loadingToast = toast.loading("Logging in...")

    startTransition(async () => {
      try {
        await login(formData)
        toast.dismiss(loadingToast)
        toast.success("Logged in successfully!")
        router.push("/dashboard")
      } catch (err: any) {
        toast.dismiss(loadingToast)
        
        // Handle specific error messages
        if (err.message.includes('verify your email')) {
          toast.error("Please verify your email before logging in. Check your inbox for the verification link.", {
            duration: 5000
          })
        } else if (err.message.includes('Invalid login credentials')) {
          toast.error("Invalid email or password. Please try again.")
        } else {
          toast.error(err.message || "Login failed. Please try again.")
        }
      }
    })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SOP Manager</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Log in</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button disabled={isPending} className="w-full" type="submit">
              {isPending ? "Logging in..." : "Log in"}
            </Button>
          </form>

          {/* Social login and divider here (no changes) */}
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center space-y-2">
          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

