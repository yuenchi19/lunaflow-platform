import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname
    // Protected Routes List
    // Protect /student, /admin, /community, /settings
    const protectedPrefixes = ['/student', '/admin', '/community', '/settings']

    const isProtected = protectedPrefixes.some(prefix => path.startsWith(prefix))

    if (isProtected && !user) {
        const redirectUrl = request.nextUrl.clone()
        if (path.startsWith('/admin')) {
            redirectUrl.pathname = '/admin/login'
        } else {
            redirectUrl.pathname = '/'
        }
        redirectUrl.searchParams.set('error', 'login_required')
        return NextResponse.redirect(redirectUrl)
    }

    // Strict Guard for Content Access (Paid Plan Check)
    if (path.startsWith('/student/course/') && user) {
        const userPlan = user.user_metadata?.plan || 'light';
        const userRole = user.user_metadata?.role || 'student';

        // Admin/Staff/Accounting bypass plan checks
        if (['admin', 'staff', 'accounting'].includes(userRole)) {
            // Allowed
        } else if (userPlan === 'light' && userRole === 'student') {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/pricing'
            return NextResponse.redirect(redirectUrl)
        }
    }

    // Role Based Access Control (RBAC)
    if (path.startsWith('/admin') && user) {
        const userRole = user.user_metadata?.role;
        // If no role or student, they shouldn't be here (already covered by login redirect logic usually, but double check)
        // Actually, normal users might login via admin/login if they try? Access control needed.

        if (!userRole || userRole === 'student') {
            // Redirect to student dashboard or home
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/student/dashboard'
            return NextResponse.redirect(redirectUrl)
        }

        // Staff: Allowed [Students, Community, Feedback, Staff(Self)]
        // Block: [Inventory, Purchase Requests, Settings, Courses(Edit?), Sales?]
        // User request: Staff = "Students, Community, Feedback/Assignments"
        if (userRole === 'staff') {
            const allowedPaths = [
                '/admin/students',
                '/admin/community',
                '/admin/feedback',
                '/admin/dashboard' // Dashboard usually needed
            ];
            // Allow subpaths
            const isAllowed = allowedPaths.some(p => path.startsWith(p));
            if (!isAllowed) {
                // Redirect to their main workspace
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/admin/students'
                return NextResponse.redirect(redirectUrl)
            }
        }

        // Accounting: Allowed [Inventory, Purchase Requests, Community]
        // User request: Accounting = "Inventory, Purchase Requests, Community"
        if (userRole === 'accounting') {
            const allowedPaths = [
                '/admin/inventory',
                '/admin/purchase-requests',
                '/admin/community',
                '/admin/dashboard'
            ];
            const isAllowed = allowedPaths.some(p => path.startsWith(p));
            if (!isAllowed) {
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/admin/inventory'
                return NextResponse.redirect(redirectUrl)
            }
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/ (API routes - generally managed separately or protected inside the handler)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/).*)',
    ],
}
