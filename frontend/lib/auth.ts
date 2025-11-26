import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Provider } from "next-auth/providers"
import db from "@/lib/prisma"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Github from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { loginSchema } from "@/lib/schema"
import { getAuthUser } from "@/utils/auth"
import type { User } from "@/types/next-auth"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"
import { isUserExists } from "@/services/authService"

const adapter = PrismaAdapter(db)

const providers: Provider[] = [
    Credentials({
        credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
            const validatedCredentials = await loginSchema.safeParse(credentials)

            if (!validatedCredentials.success) {
                return null;
            }

            const { email, password } = validatedCredentials.data;
            const user = await getAuthUser(email, password)

            if (!user) {
                return null;
            }

            return user;
        },
    }),
    Google,
    Github,
]

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter,
    providers,
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: '/en/login',
        error: '/en/error',
    },
    callbacks: {
        async jwt({ token, account, user }): Promise<JWT> {
            if (account && user) {
                token.id = user.id;
                token.provider = account.provider;
                token.role = (user as User).role || 'USER';
                token.phone = (user as User).phone;
                token.address = (user as User).address;

                try {
                    const authUser = await isUserExists(user.email as string);
                    token.created_at = authUser?.createdAt?.toISOString();
                } catch (error) {
                    console.error('>>> Error fetching user in jwt callback:', error);
                    token.created_at = new Date().toISOString();
                }

                // Store OAuth tokens if available
                if (account.access_token) {
                    token.access_token = account.access_token;
                }
                if (account.refresh_token) {
                    token.refresh_token = account.refresh_token;
                }
            }

            if (token?.id || token?.email)
                console.log(">>> JWT: ", token);
            return token;
        },
        async session({ session, token }): Promise<Session> {
            // Add token data to session
            if (session.user) {
                session.user.id = token.id as string;
                session.user.provider = token.provider as string;
                session.user.role = (token.role as 'USER' | 'ADMIN') || 'USER';
                session.user.phone = token.phone as string | undefined;
                session.user.address = token.address as string | undefined;
                session.user.created_at = token.created_at as string | undefined;
            }

            // Add access tokens to session
            if (token.access_token) {
                session.access_token = token.access_token as string;
            }
            if (token.refresh_token) {
                session.refresh_token = token.refresh_token as string;
            }

            if (session.user?.id || session.user?.email)
                console.log(">>> Session: ", session);
            return session;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 14 * 24 * 60 * 60, // 14 days
        updateAge: 15 * 60, // 15 minutes
    },
    trustHost: true,
    /**
     * lax: Cookies are not sent on normal cross-site subrequests (for example to load images or frames into a third party site), but are sent when a user is navigating to the origin site (i.e., when following a link).
     * strict: Cookies will only be sent in a first-party context and not be sent along with requests initiated by third party websites.
     * none: Cookies will be sent in all contexts, i.e., in responses to both first-party and cross-origin requests. If SameSite=None is used, the cookie Secure attribute must also be set (i.e., the cookie is only sent over secure channels).
     */
    cookies: {
        sessionToken: {
            name: `pcloud-auth.session-token`,
            options: {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: "lax",
                path: "/",
            }
        }
    },
    debug: process.env.NODE_ENV === "development",
    useSecureCookies: process.env.NODE_ENV === "production",
})