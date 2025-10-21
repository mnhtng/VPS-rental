import bcrypt from 'bcrypt';

export async function hashPassword(
    password: string,
    saltRounds: number = 12
): Promise<string> {
    return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
}
