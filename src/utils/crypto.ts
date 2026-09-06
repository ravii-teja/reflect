/**
 * End-to-End Encryption (E2EE) Module for Reflect
 * Implements AES-256-GCM encryption with PBKDF2 key derivation.
 * User memories are encrypted on device before transmission and storage.
 */

const SALT_KEY = 'reflect_e2ee_salt_v1';
const LOCAL_STORAGE_KEY = 'reflect_e2ee_device_seed';

// ArrayBuffer <-> Base64 helpers
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives a CryptoKey from a user passphrase or device seed using PBKDF2
 */
export async function deriveKeyFromPassphrase(passphrase: string, saltString?: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const salt = enc.encode(saltString || SALT_KEY);

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Gets or initializes a local device encryption key for seamless zero-knowledge privacy
 */
export async function getOrCreateDeviceCryptoKey(customPassphrase?: string): Promise<{ key: CryptoKey; isCustom: boolean }> {
  if (customPassphrase && customPassphrase.trim().length > 0) {
    const key = await deriveKeyFromPassphrase(customPassphrase);
    return { key, isCustom: true };
  }

  let seed = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!seed) {
    const randomBytes = window.crypto.getRandomValues(new Uint8Array(32));
    seed = bufferToBase64(randomBytes);
    localStorage.setItem(LOCAL_STORAGE_KEY, seed);
  }

  const key = await deriveKeyFromPassphrase(seed);
  return { key, isCustom: false };
}

/**
 * Encrypts a text string using AES-256-GCM
 */
export async function encryptText(
  plaintext: string,
  cryptoKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV recommended for AES-GCM
  const enc = new TextEncoder();
  const encoded = enc.encode(plaintext);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    cryptoKey,
    encoded
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv)
  };
}

/**
 * Decrypts an AES-256-GCM ciphertext
 */
export async function decryptText(
  ciphertext: string,
  ivBase64: string,
  cryptoKey: CryptoKey
): Promise<string> {
  try {
    const iv = base64ToBuffer(ivBase64);
    const encryptedBytes = base64ToBuffer(ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      cryptoKey,
      encryptedBytes
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.warn('Failed to decrypt text with current key. Might be encrypted with another key.', err);
    return '[Decryption failed: Key mismatch or tampered payload]';
  }
}
