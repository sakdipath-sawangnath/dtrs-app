import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getServerApiBaseUrl } from '@/lib/serverApiBase';

type BackendLoginResponse = {
    access_token: string;
    user: { id: number; name: string; username: string; role: string; image?: string; email?: string };
};

type MeResponse = {
    id: number;
    name?: string | null;
    username: string;
    role: string;
    image?: string | null;
    isLocked?: boolean;
};

function unwrapApiData<T>(root: unknown): T | null {
    if (!root) return null;
    if (typeof root === 'object' && root !== null && 'data' in (root as Record<string, unknown>)) {
        return ((root as { data?: unknown }).data as T) ?? null;
    }
    return root as T;
}

function getErrorMessageFromBody(raw: unknown): string | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const r = raw as { error?: { message?: string }; message?: string };
    if (typeof r.error?.message === 'string') return r.error.message;
    if (typeof r.message === 'string') return r.message;
    return undefined;
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'อีเมล', type: 'text' },
                password: { label: 'รหัสผ่าน', type: 'password' },
                accessToken: { label: 'token', type: 'text' },
            },
            async authorize(credentials) {
                const accessToken = credentials?.accessToken?.trim();
                const apiBase = getServerApiBaseUrl();

                if (accessToken) {
                    try {
                        const meRes = await fetch(`${apiBase}/users/me`, {
                            headers: { Authorization: `Bearer ${accessToken}` },
                        });
                        const meRaw: unknown = await meRes.json().catch(() => null);
                        const me = unwrapApiData<MeResponse>(meRaw);
                        if (!meRes.ok || !me) {
                            return null;
                        }
                        if (me.isLocked) {
                            return null;
                        }
                        const identifier = credentials?.email?.trim() || me.username;
                        const avatarProxy =
                            me.image?.trim() ? `/user-images/${me.id}` : undefined;
                        return {
                            id: String(me.id),
                            name: me.name || identifier,
                            token: accessToken,
                            accessToken,
                            role: (me.role || 'STAFF').toUpperCase(),
                            username: me.username || identifier,
                            image: avatarProxy,
                        };
                    } catch (error) {
                        console.error('Session from token error', error);
                    }
                    return null;
                }

                const identifier = credentials?.email?.trim();
                if (!identifier || !credentials?.password) return null;

                try {
                    const res = await fetch(`${apiBase}/backend-auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: identifier,
                            password: credentials.password,
                        }),
                    });

                    const raw: unknown = await res.json().catch(() => null);
                    const payload = unwrapApiData<BackendLoginResponse>(raw);
                    const rawWrapped =
                        !!raw &&
                        typeof raw === 'object' &&
                        'success' in (raw as Record<string, unknown>) &&
                        (raw as { success?: unknown }).success === true;
                    const hasAccessToken = typeof payload?.access_token === 'string' && payload.access_token.length > 0;
                    console.log('[auth][authorize]', {
                        status: res.status,
                        ok: res.ok,
                        hasWrapped: rawWrapped,
                        hasAccessToken,
                        role: payload?.user?.role,
                    });

                    if (res.status === 403) {
                        const msg = getErrorMessageFromBody(raw);
                        throw new Error(msg || 'บัญชีถูกระงับการเข้าสู่ระบบ');
                    }

                    if (res.ok && payload?.access_token) {
                        const u = payload.user || ({} as BackendLoginResponse['user']);
                        const token = payload.access_token;
                        let image: string | undefined;
                        try {
                            const meRes = await fetch(`${apiBase}/users/me`, {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            });
                            const meRaw: unknown = await meRes.json().catch(() => null);
                            const mePayload = unwrapApiData<{
                                id?: number;
                                image?: string;
                            }>(meRaw);
                            image =
                                mePayload?.image?.trim() && mePayload?.id != null
                                    ? `/user-images/${mePayload.id}`
                                    : undefined;
                        } catch {
                            // ignore
                        }

                        return {
                            id: String(u.id ?? ''),
                            name: u.name || identifier,
                            token,
                            accessToken: token,
                            role: u.role || 'STAFF',
                            username: u.username || identifier,
                            image,
                        };
                    }
                } catch (error) {
                    if (error instanceof Error) {
                        throw error;
                    }
                    console.error('Login error', error);
                }
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.accessToken =
                    (user as { accessToken?: string }).accessToken ??
                    (user as { token?: string }).token ??
                    (user as { access_token?: string }).access_token;
                token.role = (user as { role?: string }).role;
                token.uid = (user as { id?: string }).id;
                (token as { image?: string | null }).image = (user as { image?: string }).image;
                const uName = (user as { name?: string | null }).name;
                if (uName != null) token.name = uName;
            }
            if (trigger === 'update' && session) {
                const s = session as { user?: { name?: string | null; image?: string | null } };
                if (s.user?.name != null) token.name = s.user.name;
                if (s.user && 'image' in s.user) {
                    (token as { image?: string | null }).image = s.user.image ?? undefined;
                }
            }
            return token;
        },
        async session({ session, token }) {
            const accessToken = (token.accessToken ?? undefined) as string | undefined;
            (session as { accessToken?: string }).accessToken = accessToken;
            if (session.user) {
                (session.user as { accessToken?: string }).accessToken = accessToken;
            }
            (session as { userRole?: string }).userRole = (token.role as string) || 'STAFF';
            (session as { userId?: string }).userId = token.uid as string;
            if (session.user) {
                if (typeof token.name === 'string') session.user.name = token.name;
                (session.user as { role?: string }).role = (token.role as string) || 'STAFF';
                (session.user as { id?: string }).id = token.uid as string;
                (session.user as { image?: string | null }).image = (token as { image?: string | null }).image;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET || 'secret',
};
