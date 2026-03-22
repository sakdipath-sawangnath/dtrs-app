import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

type BackendLoginResponse = {
    access_token: string;
    user: { id: number; name: string; username: string; role: string; image?: string; email?: string };
};

function unwrapApiData<T>(root: unknown): T | null {
    if (!root) return null;
    if (typeof root === 'object' && root !== null && 'data' in (root as Record<string, unknown>)) {
        return ((root as { data?: unknown }).data as T) ?? null;
    }
    return root as T;
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'อีเมล', type: 'text' },
                password: { label: 'รหัสผ่าน', type: 'password' },
            },
            async authorize(credentials) {
                const identifier = credentials?.email?.trim();
                if (!identifier || !credentials?.password) return null;

                try {
                    const res = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            // backend รองรับ identifier ผ่าน email หรือ username
                            email: identifier,
                            password: credentials.password,
                        }),
                    });

                    const raw: unknown = await res.json().catch(() => null);
                    const payload = unwrapApiData<BackendLoginResponse>(raw);
                    // Debug: ช่วยตรวจว่ามี token จาก backend กลับมาถูกต้องหรือไม่
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

                    if (res.ok && payload?.access_token) {
                        const u = payload.user || ({} as BackendLoginResponse['user']);
                        const accessToken = payload.access_token;
                        // ดึง image เพิ่มเติมเพื่อให้ header แสดงรูปได้ (ถ้ามี)
                        let image: string | undefined;
                        try {
                            const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/me`, {
                                headers: {
                                    Authorization: `Bearer ${accessToken}`,
                                },
                            });
                            const meRaw: unknown = await meRes.json().catch(() => null);
                            const mePayload = unwrapApiData<{ image?: string }>(meRaw);
                            image = mePayload?.image ?? undefined;
                        } catch {
                            // ignore
                        }

                        return {
                            id: String(u.id ?? ''),
                            name: u.name || identifier,
                            // รองรับหลายชื่อ property เพื่อกัน mismatch ใน callback
                            token: accessToken,
                            accessToken,
                            role: u.role || 'STAFF',
                            username: u.username || identifier,
                            image,
                        } as {
                            id: string;
                            name: string;
                            token: string;
                            accessToken: string;
                            role: string;
                            username: string;
                            image?: string;
                        };
                    }
                } catch (error) {
                    console.error('Login error', error);
                }
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken =
                    (user as { accessToken?: string }).accessToken ??
                    (user as { token?: string }).token ??
                    (user as { access_token?: string }).access_token;
                token.role = (user as { role?: string }).role;
                token.uid = (user as { id?: string }).id;
                (token as { image?: string }).image = (user as { image?: string }).image;
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
                (session.user as { role?: string }).role = (token.role as string) || 'STAFF';
                (session.user as { id?: string }).id = token.uid as string;
                (session.user as { image?: string }).image = (token as { image?: string }).image;
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
