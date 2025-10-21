import db from "@/lib/prisma"

interface UserProps {
    name: string
    email: string
    password: string
    phone?: string | null
    address?: string | null
    role?: string
}

interface VerifyTokenProps {
    identifier: string
    token: string
    expires: Date
}

export const isUserExists = async (
    email: string,
) => {
    const userEmail = email.trim().toLocaleLowerCase()

    return await db.user.findFirst({
        where: { email: userEmail }
    })
}

export const createUser = async ({
    name,
    email,
    password,
    phone = null,
    address = null,
    role = "USER"
}: UserProps) => {
    return await db.user.create({
        data: {
            name,
            email,
            password,
            phone,
            address,
            role,
            accounts: {
                create: {
                    provider: "credentials",
                    type: "system",
                    providerAccountId: email,
                }
            },
            sessions: {
                create: {
                    sessionToken: email,
                    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
                }
            },
        }
    })
}

export const deleteUser = async ({
    id
}: {
    id: string
}) => {
    return await db.user.delete({
        where: { id }
    })
}

export const createVerifyToken = async ({
    identifier,
    token,
    expires
}: VerifyTokenProps) => {
    return await db.verificationToken.create({
        data: {
            identifier,
            token,
            expires
        }
    })
}

export const deleteVerifyToken = async ({
    id
}: {
    id: string
}) => {
    return await db.verificationToken.delete({
        where: { id }
    })
}
