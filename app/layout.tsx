import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'


export const metadata: Metadata = {
  title: 'SOP Management',
  description: 'Developed By Arkmedis',
  generator: 'Arkmedis',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
