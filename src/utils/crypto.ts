import CryptoJS from 'crypto-js';

/**
 * Encrypt text content using AES-256 with a user password
 */
export function encryptNoteContent(plainText: string, masterPassword: string): string {
  try {
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    const key = CryptoJS.PBKDF2(masterPassword, salt, { 
      keySize: 256 / 32, 
      iterations: 600000,
      hasher: CryptoJS.algo.SHA256
    });
    const iv = CryptoJS.lib.WordArray.random(128 / 8);
    const encrypted = CryptoJS.AES.encrypt(plainText, key, { iv: iv });
    return 'v2:' + salt.toString() + ':' + iv.toString() + ':' + encrypted.toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt note content.');
  }
}

/**
 * Decrypt AES-256 encrypted content using the user password
 */
export function decryptNoteContent(encryptedText: string, masterPassword: string): string {
  try {
    const parts = encryptedText.split(':');
    
    if (parts.length === 4 && parts[0] === 'v2') {
      const salt = CryptoJS.enc.Hex.parse(parts[1]);
      const iv = CryptoJS.enc.Hex.parse(parts[2]);
      const ciphertext = parts[3];
      const key = CryptoJS.PBKDF2(masterPassword, salt, { 
        keySize: 256 / 32, 
        iterations: 600000,
        hasher: CryptoJS.algo.SHA256
      });
      const bytes = CryptoJS.AES.decrypt(ciphertext, key, { iv: iv });
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (decrypted === '' && bytes.sigBytes <= 0) {
        throw new Error('Invalid password');
      }
      return decrypted;
    } else if (parts.length === 3) {
      // Legacy v1 format
      const salt = CryptoJS.enc.Hex.parse(parts[0]);
      const iv = CryptoJS.enc.Hex.parse(parts[1]);
      const ciphertext = parts[2];
      const key = CryptoJS.PBKDF2(masterPassword, salt, { keySize: 256 / 32, iterations: 100000 });
      const bytes = CryptoJS.AES.decrypt(ciphertext, key, { iv: iv });
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (decrypted === '' && bytes.sigBytes <= 0) {
        throw new Error('Invalid password');
      }
      return decrypted;
    } else {
      // Fallback for older format
      const bytes = CryptoJS.AES.decrypt(encryptedText, masterPassword);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (decrypted === '' && bytes.sigBytes <= 0) {
        throw new Error('Invalid password');
      }
      return decrypted;
    }
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Invalid password or corrupted data.');
  }
}

/**
 * Extract bi-directional [[wikilinks]] from markdown content
 */
export function extractWikiLinks(markdownContent: string): string[] {
  const wikiLinkRegex = /\[\[(.*?)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = wikiLinkRegex.exec(markdownContent)) !== null) {
    if (match[1] && !links.includes(match[1])) {
      links.push(match[1].trim());
    }
  }
  return links;
}

/**
 * Extract #tags from markdown content
 */
export function extractTags(markdownContent: string): string[] {
  // Negative lookahead prevents matching tags that only consist of numbers or underscores/hyphens
  const tagRegex = /(?:^|\s)#(?!\d+(?:\s|$)|[-_]+(?:\s|$))([\p{L}\p{N}_\-]+)/gu;
  const tags: string[] = [];
  let match;
  while ((match = tagRegex.exec(markdownContent)) !== null) {
    if (match[1] && !tags.includes(match[1])) {
      tags.push(match[1].trim());
    }
  }
  return tags;
}
