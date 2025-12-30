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
        redirectUrl.pathname = '/'
        redirectUrl.searchParams.set('error', 'login_required')
        return NextResponse.redirect(redirectUrl)
    }

    // Strict Guard for Content Access (Paid Plan Check)
    if (path.startsWith('/student/course/') && user) {
        const userPlan = user.user_metadata?.plan || 'light';
        // Assuming 'light' is the unpaid/default plan. 
        // If the user is admin/staff they might have 'light' but should bypass? 
        // Metadata usually has role too.
        const userRole = user.user_metadata?.role || 'student';

        if (userPlan === 'light' && userRole === 'student') {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/pricing' // or /plans
            return NextResponse.redirect(redirectUrl)
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
