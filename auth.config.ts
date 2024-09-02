import type { NextAuthConfig } from 'next-auth';

// Specify configuration details for NextAuth.js
export const authConfig = {
    // Specify custom sign-in, sign-out and error pages
    pages: {
        signIn: '/login',
    },
    callbacks: {
        // Verify if a request is authorized to access a page via Next.js middleware
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;