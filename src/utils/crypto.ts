import CryptoJS from 'crypto-js';

/**
 * Encrypt text content using AES-256 with a user password
 */
export function encryptNoteContent(plainText: string, masterPassword: string): string {
  try {
    return CryptoJS.AES.encrypt(plainText, masterPassword).toString();
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
    const bytes = CryptoJS.AES.decrypt(encryptedText, masterPassword);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Invalid password');
    }
    return decrypted;
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
  const tagRegex = /(?:^|\s)#([a-zA-Z0-9_\-\u0400-\u04FF]+)/g;
  const tags: string[] = [];
  let match;
  while ((match = tagRegex.exec(markdownContent)) !== null) {
    if (match[1] && !tags.includes(match[1])) {
      tags.push(match[1].trim());
    }
  }
  return tags;
}
