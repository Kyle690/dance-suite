import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

const getKey = (): Buffer => {
    const secret = process.env.LOGIN_CODE_SECRET;
    if (!secret || secret.length !== 64) {
        throw new Error('LOGIN_CODE_SECRET must be a 64-character hex string (32 bytes)');
    }
    return Buffer.from(secret, 'hex');
};

/**
 * Encrypts a login code.
 * Returns a string in the format: `iv:authTag:ciphertext` (all hex-encoded).
 */
export const encryptCode = (plaintext: string): string => {
    const key = getKey();
    const iv = randomBytes(12); // 96-bit IV for GCM
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * Decrypts a login code previously encrypted with `encryptCode`.
 * Returns null if decryption fails (wrong key, tampered data, legacy plain value).
 */
export const decryptCode = (stored: string): string | null => {
    try {
        const parts = stored.split(':');
        if (parts.length !== 3) return null;

        const [ ivHex, authTagHex, ciphertextHex ] = parts;
        const key = getKey();
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const ciphertext = Buffer.from(ciphertextHex, 'hex');

        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);

        return decrypted.toString('utf8');
    } catch {
        return null;
    }
};
