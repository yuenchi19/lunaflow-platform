import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const requestPath = request.nextUrl.pathname;
    // Debug Log for Vercel Functions
    console.log(`[Middleware] Processing path: ${requestPath}`);

    // 1. Force Bypass for Webhooks (Top Priority)
    if (requestPath.startsWith('/api/webhooks') || requestPath.startsWith('/api/admin/sync-stripe')) {
        console.log(`[Middleware] Bypassing auth for system route: ${requestPath}`);
        return NextResponse.next();
    }

    // 2. Initial Auth Check (Supabase)
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

    if (!user && requestPath.startsWith('/api/') && !requestPath.includes('/api/auth')) {
        // Optional: Protect other API routes if needed.
    }

    const path = requestPath;
    // Protected Routes List
    // Protect /student, /admin, /community, /settings
    // Protected Routes List
    const protectedPrefixes = ['/student', '/admin', '/community', '/settings', '/affiliate']

    const isProtected = protectedPrefixes.some(prefix => path.startsWith(prefix))

    if (isProtected && !user) {
        console.log(`[Middleware] Redirecting unauthenticated user from ${path}`);
        const redirectUrl = request.nextUrl.clone()
        if (path.startsWith('/admin')) {
            redirectUrl.pathname = '/admin/login'
        } else {
            redirectUrl.pathname = '/'
        }
        redirectUrl.searchParams.set('error', 'login_required')
        return NextResponse.redirect(redirectUrl)
    }

    // Check Subscription Status (Strict)
    if (user && (path.startsWith('/student') || path.startsWith('/affiliate'))) {
        const subStatus = user.user_metadata?.subscriptionStatus;
        // Block if explicitly inactive/canceled/unpaid
        if (subStatus && ['canceled', 'inactive', 'unpaid', 'past_due'].includes(subStatus)) {
            console.log(`[Middleware] Blocking user with status: ${subStatus}`);
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = '/pricing'; // Redirect to pricing/payment page
            return NextResponse.redirect(redirectUrl);
        }
    }

    // Strict Guard for Content Access (Paid Plan Check)
    if (path.startsWith('/student') && user) {
        const userPlan = user.user_metadata?.plan || 'light';
        const userRole = user.user_metadata?.role || 'student';

        // Redirect Partner to Affiliate Dashboard if they try to access Student Dashboard
        if (userPlan === 'partner') {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/affiliate/dashboard'
            return NextResponse.redirect(redirectUrl)
        }

        // Admin/Staff/Accounting bypass plan checks
        if (['admin', 'staff', 'accounting'].includes(userRole)) {
            // Allowed
        } else if (userPlan === 'light' && userRole === 'student') {
            // Light plan restrictions if any specific per-course logic is needed, 
            // but strictly for /student/course/ access:
            if (path.startsWith('/student/course/')) {
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/pricing'
                return NextResponse.redirect(redirectUrl)
            }
        }
    }

    // Partner Route Guard
    if (path.startsWith('/affiliate') && user) {
        const userPlan = user.user_metadata?.plan;
        // Only 'partner' plan or admin can access
        // If generic student tries to access /affiliate -> /student/dashboard
        if (userPlan !== 'partner' && user.user_metadata?.role !== 'admin') {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/student/dashboard'
            return NextResponse.redirect(redirectUrl)
        }
    }

    // Role Based Access Control (RBAC)
    if (path.startsWith('/admin') && user) {
        const userRole = user.user_metadata?.role;

        // Strict Check: Unauthorized users (student/partner) -> Top Page
        if (!userRole || userRole === 'student' || userRole === 'partner') { // Partner has student role usually, but explicitly checking
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/'
            return NextResponse.redirect(redirectUrl)
        }

        // Staff: Allowed [Students, Community, Feedback, Staff(Self)]
        if (userRole === 'staff') {
            const allowedPaths = [
                '/admin/students',
                '/admin/community',
                '/admin/feedback',
                '/admin/dashboard'
            ];
            const isAllowed = allowedPaths.some(p => path.startsWith(p));
            if (!isAllowed) {
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/admin/students'
                return NextResponse.redirect(redirectUrl)
            }
        }

        // Accounting: Allowed [Inventory, Purchase Requests, Community]
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
         * NOTE: Using simple glob to avoid regex issues
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
