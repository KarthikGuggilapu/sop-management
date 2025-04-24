"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { signup } from "./action"
import { toast } from "sonner"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<ValidationErrors>({})

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    let hasErrors = false

    // First Name validation
    if (!firstName.trim()) {
      newErrors.firstName = "First name is required"
      hasErrors = true
    } else if (firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters"
      hasErrors = true
    }

    // Last Name validation
    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required"
      hasErrors = true
    } else if (lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters"
      hasErrors = true
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      newErrors.email = "Email is required"
      hasErrors = true
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address"
      hasErrors = true
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required"
      hasErrors = true
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
      hasErrors = true
    }

    // Confirm Password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
      hasErrors = true
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
      hasErrors = true
    }

    setErrors(newErrors)

    if (hasErrors) {
      toast.error("Please fix the validation errors before submitting")
    }

    return !hasErrors
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const formData = new FormData()
    formData.append("first_name", firstName)
    formData.append("last_name", lastName)
    formData.append("email", email)
    formData.append("password", password)

    // Show loading toast
    const loadingToast = toast.loading("Creating your account...")

    startTransition(async () => {
      try {
        await signup(formData)
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast)
        toast.success("Account created successfully! Please check your email for verification.")
        router.push("/login")
      } catch (err: any) {
        // Dismiss loading toast and show error
        toast.dismiss(loadingToast)
        
        // Handle specific error cases
        if (err.message.includes("email")) {
          toast.error("This email is already registered. Please try logging in instead.")
        } else if (err.message.includes("password")) {
          toast.error("Password is too weak. Please use at least 6 characters.")
        } else {
          toast.error(err.message || "Failed to create account. Please try again.")
        }
      }
    })
  }

  const clearForm = () => {
    setFirstName("")
    setLastName("")
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setErrors({})
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SOP Manager</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={errors.firstName ? "border-red-500" : ""}
                  required
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={errors.lastName ? "border-red-500" : ""}
                  required
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? "border-red-500" : ""}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? "border-red-500" : ""}
                required
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={errors.confirmPassword ? "border-red-500" : ""}
                required
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center space-y-2">
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}


