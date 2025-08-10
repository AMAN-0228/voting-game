import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.cookies.get('next-auth.session-token')?.value
    
    // Define public paths that don't require authentication
    const publicPaths = ['/login', '/register']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

    // If user is authenticated and tries to access login/register, redirect to home
    if (token && isPublicPath) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Continue with the request
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Define protected routes
        const protectedPaths = ['/dashboard', '/rooms', '/game']
        const { pathname } = req.nextUrl
        
        // Check if the current path is protected
        const isProtectedPath = protectedPaths.some(path => 
          pathname.startsWith(path)
        )
        
        // Allow access to protected routes only if user is authenticated
        if (isProtectedPath) {
          return !!token
        }
        
        // Allow access to public routes
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    // Exclude NextAuth routes, static assets, favicon, public, Socket.IO path, and socket init endpoint
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public|socket.io|api/socket).*)',
  ],
}
