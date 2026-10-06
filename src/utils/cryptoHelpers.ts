/**
 * Web Crypto API based AES-256-GCM encryption & decryption
 * Uses PBKDF2 for key derivation with 100,000 iterations and SHA-256.
 */

// Helper: Uint8Array <-> Base64
export const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const base64ToBuffer = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// Derive AES-GCM key from PIN / Passphrase and Salt using PBKDF2
const deriveKey = async (pin: string, salt: Uint8Array, iterations = 100000): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export interface EncryptedPayload {
  version: number;
  salt: string; // Base64 (16 bytes)
  iv: string;   // Base64 (12 bytes)
  data: string; // Base64
}

/**
 * Encrypts a plaintext string (e.g. Google Sheet CSV URL) using an 8-digit PIN or password
 */
export const encryptUrl = async (plainText: string, pin: string): Promise<string> => {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(pin, salt);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    enc.encode(plainText)
  );

  const payload: EncryptedPayload = {
    version: 1,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    data: bufferToBase64(encrypted)
  };

  return btoa(JSON.stringify(payload));
};

/**
 * Decrypts the encrypted payload string using the PIN
 * Throws an error if the PIN is incorrect or payload is invalid
 */
export const decryptUrl = async (encryptedBase64Payload: string, pin: string): Promise<string> => {
  try {
    const jsonStr = atob(encryptedBase64Payload.trim());
    const payload: EncryptedPayload = JSON.parse(jsonStr);

    if (!payload.salt || !payload.iv || !payload.data) {
      throw new Error('Invalid payload structure');
    }

    const salt = base64ToBuffer(payload.salt);
    const iv = base64ToBuffer(payload.iv);
    const data = base64ToBuffer(payload.data);

    const key = await deriveKey(pin, salt);
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as any
      },
      key,
      data as any
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    throw new Error('PIN_INCORRECT_OR_DECRYPTION_FAILED');
  }
};
