import { hash, verify } from '@node-rs/argon2';

export async function hashPassword(
    password: string
): Promise<string> {
    return await hash(password, {
        memoryCost: 65536,  // 64 MiB
        timeCost: 3,        // 3 iterations
        outputLen: 32,      // 32 bytes
        parallelism: 4,     // 4 threads
    });
}

export async function verifyPassword(
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> {
    try {
        return await verify(hashedPassword, plainPassword);
    } catch {
        return false;
    }
}
