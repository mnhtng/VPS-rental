"use server"

import { signIn, signOut } from "@/lib/auth";
import { isUserExists } from "@/services/authService";
import { verifyPassword } from "@/utils/hash";
import type { User } from "@/types/next-auth";

export const loginWithGoogle = async () => {
    await signIn("google", {
        redirectTo: "/",
    })
}

export const loginWithGithub = async () => {
    await signIn("github", {
        redirectTo: "/",
    })
}

export const loginWithCredentials = async (email: string, password: string) => {
    return await signIn("credentials", {
        email,
        password,
        redirect: false,
    })
}

export const logout = async () => {
    await signOut({
        redirect: false,
    })
}

export const getAuthUser = async (
    email: string,
    password: string,
): Promise<User | null> => {
    try {
        const user = await isUserExists(email)

        if (!user)
            return null

        const isValidPassword = await verifyPassword(password, user?.password || '');

        if (!isValidPassword)
            return null

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: (user.role as 'USER' | 'ADMIN') || 'USER',
            phone: user.phone,
            address: user.address,
            created_at: user.createdAt?.toISOString(),
            provider: 'credentials',
        }
    } catch (error) {
        console.error('>>> Error in getAuthUser:', error);
        return null
    }
}
