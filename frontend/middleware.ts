import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup']

// Protected routes that require authentication
const protectedRoutes = ['/dashboard']

// Routes that should redirect authenticated users away
const authRoutes = ['/login', '/signup']

/**
 * Check if a route matches a pattern (supports dynamic routes)
 */
function matchesRoute(pathname: string, route: string): boolean {
  // Exact match
  if (pathname === route) {
    return true
  }

  // Check if it's a protected route prefix
  if (route.endsWith('*')) {
    const prefix = route.slice(0, -1)
    return pathname.startsWith(prefix)
  }

  // Check if it's a dynamic route pattern
  const routePattern = route.replace(/\[.*?\]/g, '[^/]+')
  const regex = new RegExp(`^${routePattern}$`)
  return regex.test(pathname)
}

/**
 * Check if pathname is a public route
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => matchesRoute(pathname, route))
}

/**
 * Check if pathname is a protected route
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => matchesRoute(pathname, route))
}

/**
 * Check if pathname is an auth route (login/signup)
 */
function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(route => matchesRoute(pathname, route))
}

/**
 * Get authentication token from cookies
 */
function getAuthToken(request: NextRequest): string | null {
  const token = request.cookies.get('auth_token')?.value
  return token || null
}

/**
 * Check if user is authenticated
 */
function isAuthenticated(request: NextRequest): boolean {
  const token = getAuthToken(request)
  return !!token
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuth = isAuthenticated(request)
  const isPublic = isPublicRoute(pathname)
  const isProtected = isProtectedRoute(pathname)
  const isAuthPage = isAuthRoute(pathname)

  // Redirect authenticated users away from auth pages (login, signup)
  if (isAuth && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from home page
  if (isAuth && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users from protected routes to login
  if (!isAuth && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Allow access to public routes
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
