'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, LogOut, User } from 'lucide-react'
import { useSessionContext } from './SessionProvider'
import { useRoomStore } from '@/store/room-store'
import { useGameStore } from '@/store/game-store'

// Memoized NavBar component to prevent unnecessary re-renders
const NavBar = React.memo(() => {
  const { session, status, isAuthenticated, user } = useSessionContext()
  
  // Get store reset functions
  const { resetRoomState } = useRoomStore()
  const { resetGameState } = useGameStore()

  // Memoize the sign out handler to prevent recreation on every render
  const handleSignOut = useMemo(() => {
    return () => {
      signOut({ callbackUrl: '/login' })
    }
  }, [])

  // Memoize the home navigation handler to clear stores
  const handleHomeClick = useMemo(() => {
    return () => {
      console.log('🏠 Clearing stores on home navigation from NavBar')
      resetRoomState()
      resetGameState()
    }
  }, [resetRoomState, resetGameState])

  // Memoize user info to prevent unnecessary re-renders
  const userInfo = useMemo(() => {
    if (!user) return null
    
    return {
      name: user.name || 'Player',
      email: user.email,
      isAuthenticated
    }
  }, [user?.name, user?.email, isAuthenticated])

  // Memoize navigation links to prevent recreation
  const navigationLinks = useMemo(() => (
    <div className="hidden md:flex items-center space-x-8">
      <Link 
        href="/" 
        // onClick={handleHomeClick}
        className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
      >
        Home
      </Link>
      {userInfo?.isAuthenticated && (
        <Link 
          href="/profile" 
          className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
        >
          Profile
        </Link>
      )}
    </div>
  ), [userInfo?.isAuthenticated])

  // Memoize user actions section
  const userActions = useMemo(() => {
    if (status === 'loading') {
      return (
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
      )
    }

    if (userInfo?.isAuthenticated) {
      return (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
              <p className="text-xs text-gray-500">{userInfo.email}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            Online
          </Badge>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )
    }

    return (
      <div className="flex items-center space-x-3">
        <Link href="/login">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            Sign Up
          </Button>
        </Link>
      </div>
    )
  }, [status, userInfo, handleSignOut])

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand - memoized to prevent re-renders */}
          <div className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Voting Game
              </span>
            </Link>
          </div>

          {/* Navigation Links - memoized */}
          {navigationLinks}

          {/* User Actions - memoized */}
          <div className="flex items-center space-x-4">
            {userActions}
          </div>
        </div>
      </div>
    </nav>
  )
})

// Set display name for debugging
NavBar.displayName = 'NavBar'

export default NavBar
