import db from "@/lib/prisma"

export const isUserExists = async (
    email: string,
) => {
    if (!email)
        return null

    const userEmail = email.trim().toLocaleLowerCase()

    return await db.user.findFirst({
        where: { email: userEmail }
    })
}
