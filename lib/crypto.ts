import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Obtém a chave mestra de criptografia das variáveis de ambiente.
 * Deve ser uma string Base64 que resulte em 32 bytes de dados binários.
 */
function getMasterKey(): Buffer {
    const keyBase64 = process.env.APP_ENCRYPTION_KEY_BASE64;

    if (!keyBase64) {
        throw new Error('A variável de ambiente APP_ENCRYPTION_KEY_BASE64 não está configurada.');
    }

    try {
        const key = Buffer.from(keyBase64, 'base64');
        if (key.length !== 32) {
            throw new Error('A chave de criptografia deve ter exatamente 32 bytes após decodificada do Base64.');
        }
        return key;
    } catch (error: any) {
        throw new Error(`Erro ao processar APP_ENCRYPTION_KEY_BASE64: ${error.message}`);
    }
}

export type EncryptedData = {
    ciphertext: string;
    iv: string;
    tag: string;
};

/**
 * Criptografa um texto usando AES-256-GCM.
 */
export function encrypt(text: string): EncryptedData {
    const key = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let ciphertext = cipher.update(text, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
        ciphertext,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
    };
}

/**
 * Descriptografa um texto usando AES-256-GCM.
 */
export function decrypt(encrypted: EncryptedData): string {
    const key = getMasterKey();
    const iv = Buffer.from(encrypted.iv, 'hex');
    const tag = Buffer.from(encrypted.tag, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
