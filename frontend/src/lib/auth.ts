import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const ACCESS_TOKEN_MAX_AGE_MS = 28 * 60 * 1000; // 28 minutes

async function refreshBackendToken(refreshToken: string): Promise<{ access_token: string; refresh_token?: string } | null> {
    try {
        const res = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

// ─── Extend NextAuth Types ──────────────────────────────────
declare module 'next-auth' {
    interface Session {
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
        backendTokenExpiresAt?: number;
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
                    return null;
                }

                try {
                    const loginUrl = `${API_BASE}/api/auth/login`;

                    const res = await fetch(loginUrl, {
                        method: 'POST',
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password
                        }),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (!res.ok) {
                        return null;
                    }

                    const data = await res.json();

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
                } catch {
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
                            google_id_token: account.id_token,
                        }),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        user.backendToken = data.access_token;
                        user.refreshToken = data.refresh_token;
                        user.isPremium = data.user?.is_premium || false;
                    } else {
                        return false;
                    }
                } catch {
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
                token.backendTokenExpiresAt = Date.now() + ACCESS_TOKEN_MAX_AGE_MS;
            }

            // On subsequent calls, refresh the backend token if expired
            if (
                token.backendTokenExpiresAt &&
                Date.now() > token.backendTokenExpiresAt &&
                token.refreshToken
            ) {
                const refreshed = await refreshBackendToken(token.refreshToken);
                if (refreshed) {
                    token.backendToken = refreshed.access_token;
                    if (refreshed.refresh_token) {
                        token.refreshToken = refreshed.refresh_token;
                    }
                    token.backendTokenExpiresAt = Date.now() + ACCESS_TOKEN_MAX_AGE_MS;
                }
            }

            return token;
        },
        async session({ session, token }) {
            // backendToken stays in the server-side JWT (httpOnly cookie) only.
            // It is injected by the proxy route — never exposed to client JS.
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
