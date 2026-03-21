import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// ─── Extend NextAuth Types ──────────────────────────────────
declare module 'next-auth' {
    interface Session {
        backendToken?: string;
        isPremium?: boolean;
        user: {
            id?: string;
            name?: string | null;
            email?: string | null;
        };
    }
    interface User {
        backendToken?: string;
        refreshToken?: string;
        isPremium?: boolean;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        backendToken?: string;
        refreshToken?: string;
        isPremium?: boolean;
    }
}

// ─── Auth Configuration ─────────────────────────────────────
export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.error('[AUTH] Missing credentials');
                    return null;
                }

                try {
                    const loginUrl = `${API_BASE}/api/auth/login`;
                    console.log('[AUTH] Attempting login to:', loginUrl, 'email:', credentials.email);

                    const res = await fetch(loginUrl, {
                        method: 'POST',
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password
                        }),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    console.log('[AUTH] Login response status:', res.status);

                    if (!res.ok) {
                        const errorText = await res.text();
                        console.error('[AUTH] Login failed:', res.status, errorText);
                        return null;
                    }

                    const data = await res.json();
                    console.log('[AUTH] Login success, user:', data?.user?.email);

                    if (data?.user) {
                        return {
                            id: String(data.user.id || "1"),
                            name: data.user.name || credentials.email,
                            email: data.user.email,
                            backendToken: data.access_token,
                            refreshToken: data.refresh_token,
                            isPremium: data.user.is_premium || false,
                        };
                    }
                    return null;
                } catch (error) {
                    console.error('[AUTH] Login error:', error);
                    return null;
                }
            }
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // When signing in with Google, auto-register/login on the backend
            if (account?.provider === 'google' && user?.email) {
                try {
                    const res = await fetch(`${API_BASE}/api/auth/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: user.name || user.email.split('@')[0],
                            email: user.email,
                        }),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        // Stash backend tokens on the user object so jwt callback can read them
                        user.backendToken = data.access_token;
                        user.refreshToken = data.refresh_token;
                        user.isPremium = data.user?.is_premium || false;
                    } else {
                        console.error('Backend Google auth failed:', await res.text());
                        return false; // Block sign-in if backend rejects
                    }
                } catch (err) {
                    console.error('Backend Google auth error:', err);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            // On initial sign-in, transfer backend tokens to the NextAuth JWT
            if (user) {
                token.backendToken = user.backendToken;
                token.refreshToken = user.refreshToken;
                token.isPremium = user.isPremium || false;
            }
            return token;
        },
        async session({ session, token }) {
            // Expose backendToken and isPremium on the client-side session object
            session.backendToken = token.backendToken;
            session.isPremium = token.isPremium || false;
            return session;
        },
    },
    pages: {
        signIn: '/',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
