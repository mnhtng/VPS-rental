import { DefaultSession } from "next-auth"
import { Timestamp } from "next/dist/server/lib/cache-handlers/types"

export interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    phone?: string | null
    address?: string | null
    role?: 'USER' | 'ADMIN'
    created_at?: Timestamp | DateTime | string
    provider?: string
}

declare module "next-auth" {
    interface Session {
        user: User & DefaultSession["user"]
        access_token?: string
        refresh_token?: string
    }

    interface User {
        id: string
        name?: string | null
        email?: string | null
        image?: string | null
        phone?: string | null
        address?: string | null
        role?: 'USER' | 'ADMIN'
        created_at?: Timestamp | DateTime | string
        provider?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string
        provider?: string
        role?: 'USER' | 'ADMIN'
        phone?: string | null
        address?: string | null
        created_at?: Timestamp | DateTime | string
        access_token?: string
        refresh_token?: string
    }
}
