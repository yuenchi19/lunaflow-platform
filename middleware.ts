import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    try {
        let response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        })

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.warn("Middleware: Missing Supabase Env Vars. Skipping Auth.");
            return response;
        }

        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                request.cookies.set(name, value)
                            })
                            response = NextResponse.next({
                                request: {
                                    headers: request.headers,
                                },
                            })
                            cookiesToSet.forEach(({ name, value, options }) =>
                                response.cookies.set(name, value, options)
                            )
                        } catch (cookieError) {
                            console.error("Middleware Cookie Error:", cookieError);
                        }
                    },
                },
            }
        )

        const {
            data: { user },
        } = await supabase.auth.getUser()

        // 4. Access Control
        // Admin routes
        if (request.nextUrl.pathname.startsWith('/admin')) {
            if (request.nextUrl.pathname === '/admin/login') {
                return response;
            }

            if (!user) {
                return NextResponse.redirect(new URL('/admin/login', request.url));
            }
        }

        // Student routes
        if (request.nextUrl.pathname.startsWith('/student') && !user) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        return response
    } catch (e) {
        console.error("Middleware Critical Error:", e);
        // Fallback: Allow request to proceed (or redirect to error page if critical)
        // For now, allow proceed to prevent total lockout, but functionality might be broken.
        return NextResponse.next({
            request: {
                headers: request.headers,
            },
        });
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
