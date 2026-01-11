// Simple encryption/decryption for localStorage data
// Note: This is obfuscation, not true security. For real security, use server-side storage.

const ENCRYPTION_KEY = "nav1g1um_s3cr3t_k3y_2024";

function generateKey(key: string): number[] {
  const result: number[] = [];
  for (let i = 0; i < key.length; i++) {
    result.push(key.charCodeAt(i));
  }
  return result;
}

export function encrypt(text: string): string {
  const keyBytes = generateKey(ENCRYPTION_KEY);
  let result = "";
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyByte = keyBytes[i % keyBytes.length];
    const encrypted = charCode ^ keyByte;
    result += encrypted.toString(16).padStart(4, "0");
  }
  
  return btoa(result);
}

export function decrypt(encoded: string): string {
  try {
    const keyBytes = generateKey(ENCRYPTION_KEY);
    const hex = atob(encoded);
    let result = "";
    
    for (let i = 0; i < hex.length; i += 4) {
      const encrypted = parseInt(hex.substring(i, i + 4), 16);
      const keyByte = keyBytes[(i / 4) % keyBytes.length];
      const charCode = encrypted ^ keyByte;
      result += String.fromCharCode(charCode);
    }
    
    return result;
  } catch {
    return "";
  }
}

export function encryptObject<T>(obj: T): string {
  return encrypt(JSON.stringify(obj));
}

export function decryptObject<T>(encoded: string): T | null {
  try {
    const decrypted = decrypt(encoded);
    return decrypted ? JSON.parse(decrypted) : null;
  } catch {
    return null;
  }
}
