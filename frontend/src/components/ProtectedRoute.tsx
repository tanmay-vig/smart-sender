'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      // Check if user is logged in by looking for required data in localStorage
      const userEmail = localStorage.getItem('userEmail')
      const userName = localStorage.getItem('userName')
      
      if (userEmail && userName) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        // Redirect to login page if not authenticated
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return null // Router will handle redirect
  }

  // Show protected content if authenticated
  return <>{children}</>
}
