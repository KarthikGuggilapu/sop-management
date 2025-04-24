import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, CheckCircle, FileSpreadsheet, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SOP Manager</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
              Dashboard
            </Link>
            <Link href="/sops" className="text-sm font-medium hover:underline underline-offset-4">
              SOPs
            </Link>
            <Link href="/analytics" className="text-sm font-medium hover:underline underline-offset-4">
              Analytics
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Streamline Your Standard Operating Procedures
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Create, manage, and track SOPs with ease. Empower your team with clear step-by-step instructions.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/login">
                    <Button size="lg" className="gap-1">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button size="lg" variant="outline">
                      View Demo
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto lg:mx-0 relative">
                <div className="relative h-[350px] w-full overflow-hidden rounded-xl border bg-background shadow-xl md:h-[420px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background"></div>
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background"></div>
                  </div>
                  <div className="relative h-full p-6 flex flex-col items-center justify-center">
                    <div className="w-full max-w-md mx-auto bg-card rounded-lg shadow-lg p-6 border">
                      <h3 className="text-xl font-semibold mb-4">SOP Dashboard Preview</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 rounded-md bg-muted/50">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">Customer Onboarding</h4>
                            <div className="h-2 w-full bg-muted mt-2 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: "75%" }}></div>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">75%</span>
                        </div>
                        <div className="flex items-center gap-4 p-3 rounded-md bg-muted/50">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">Product Setup Guide</h4>
                            <div className="h-2 w-full bg-muted mt-2 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: "40%" }}></div>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">40%</span>
                        </div>
                        <div className="flex items-center gap-4 p-3 rounded-md bg-muted/50">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">Support Ticket Resolution</h4>
                            <div className="h-2 w-full bg-muted mt-2 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: "90%" }}></div>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">90%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Everything you need to create, manage, and track your SOPs in one place
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Excel Upload</h3>
                <p className="text-center text-muted-foreground">
                  Upload Excel files to automatically populate SOP steps and save time
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Step-by-Step Guides</h3>
                <p className="text-center text-muted-foreground">
                  Create detailed guides with What, Why, How sections and embedded videos
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Progress Tracking</h3>
                <p className="text-center text-muted-foreground">
                  Track user progress through each SOP with detailed analytics
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Role-Based Access</h3>
                <p className="text-center text-muted-foreground">
                  Separate admin and user roles with appropriate permissions
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Easy Editing</h3>
                <p className="text-center text-muted-foreground">
                  Create and edit SOPs with an intuitive interface and rich text editor
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
                <div className="rounded-full bg-primary/10 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M3 3v18h18"></path>
                    <path d="m19 9-5 5-4-4-3 3"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold">Analytics</h3>
                <p className="text-center text-muted-foreground">
                  View detailed analytics on SOP completion rates and user progress
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2023 SOP Manager. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Privacy
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
