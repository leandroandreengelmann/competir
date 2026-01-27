import crypto from 'crypto';

/**
 * Utilitário de criptografia para chaves de API Asaas
 * Algoritmo: AES-256-GCM
 * Formato: v1:iv_base64:tag_base64:encrypted_base64
 */

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';

function getMasterKey() {
    const key = process.env.ASAAS_KEYS_MASTER_KEY;
    if (!key) {
        throw new Error('ASAAS_KEYS_MASTER_KEY não configurada no ambiente.');
    }
    // Suporta chaves em Base64 ou texto puro (se 32 bytes)
    const buffer = Buffer.from(key, key.length === 44 ? 'base64' : 'utf8');
    if (buffer.length !== 32) {
        throw new Error('ASAAS_KEYS_MASTER_KEY deve ter exatamente 32 bytes (256 bits).');
    }
    return buffer;
}

export function encryptAsaasKey(key: string): string {
    if (!key) return '';

    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

    let encrypted = cipher.update(key, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const tag = cipher.getAuthTag().toString('base64');

    return `${VERSION}:${iv.toString('base64')}:${tag}:${encrypted}`;
}

export function decryptAsaasKey(ciphertext: string): string {
    if (!ciphertext) return '';

    // Fallback: se não tiver o prefixo da versão, assume que é plain-text (legado)
    if (!ciphertext.startsWith(`${VERSION}:`)) {
        return ciphertext;
    }

    const parts = ciphertext.split(':');
    if (parts.length !== 4) {
        throw new Error('Formato de ciphertext inválido.');
    }

    const [, ivBase64, tagBase64, encryptedBase64] = parts;
    const masterKey = getMasterKey();
    const iv = Buffer.from(ivBase64, 'base64');
    const tag = Buffer.from(tagBase64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
