import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        });
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        // 1. Get User
        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser();

        if (authError) {
            console.error("Middleware Auth Error:", authError);
            // Don't crash, just treat as unauthenticated
        }

        // 2. Define Routes
        const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
        const isProtectedRoute =
            request.nextUrl.pathname.startsWith('/dashboard') ||
            request.nextUrl.pathname.startsWith('/welcome');

        // 3. Unauthenticated Access Logic
        if (!user && isProtectedRoute) {
            return NextResponse.redirect(new URL('/auth', request.url));
        }

        // 4. Authenticated Access Logic (The "Supreme Judge")
        if (user) {
            // If user is on Auth page, kick them out to triage (except for reset-password flow)
            if (isAuthPage && !request.nextUrl.pathname.startsWith('/auth/reset-password')) {
                return NextResponse.redirect(new URL('/welcome', request.url));
            }

            // If user is accessing a protected area, verify their role
            if (isProtectedRoute) {
                // Fetch Role from Profiles
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error("Middleware Profile Error:", profileError);
                    // Decide execution safety: if we can't get role, maybe let them through to /welcome or block?
                    // Safe default: let them proceed to dashboard, component will handle missing data, 
                    // OR redirect to welcome if we want to be safe.
                    // Let's redirect to welcome to avoid dashboard crashes.
                    if (!request.nextUrl.pathname.startsWith('/welcome')) {
                        return NextResponse.redirect(new URL('/welcome', request.url));
                    }
                }

                const role = profile?.role;
                const path = request.nextUrl.pathname;

                // STRICT ROUTING LOGIC:
                // 1. ADMIN -> /dashboard/admin
                if (role === 'admin') {
                    if (!path.startsWith('/dashboard/admin')) {
                        return NextResponse.redirect(new URL('/dashboard/admin', request.url));
                    }
                }
                // 2. ELEVE -> /dashboard/eleve
                else if (role === 'eleve') {
                    if (!path.startsWith('/dashboard/eleve')) {
                        return NextResponse.redirect(new URL('/dashboard/eleve', request.url));
                    }
                }
                // 3. CLIENT -> /dashboard/client
                else if (role === 'client') {
                    if (!path.startsWith('/dashboard/client')) {
                        return NextResponse.redirect(new URL('/dashboard/client', request.url));
                    }
                }
                // 4. NO ROLE -> /welcome
                else {
                    if (!path.startsWith('/welcome')) {
                        return NextResponse.redirect(new URL('/welcome', request.url));
                    }
                }
            }
        }
    } catch (e) {
        // CRITICAL ERROR HANDLER
        // If Supabase creation fails or other unexpected error
        console.error("MIDDLEWARE CRITICAL FAILURE:", e);
        // Fail open: let the request pass, the page components will likely show errors or auth redirect
        return NextResponse.next();
    }

    return response;
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
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
