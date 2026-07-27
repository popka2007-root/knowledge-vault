import { Note, Folder } from '../types';
import { extractTags, extractWikiLinks } from './crypto';

/**
 * Parses raw Obsidian .md file contents into a Knowledge Vault Note object
 */
export function parseObsidianNote(fileName: string, fileContent: string, folderName: string = ''): Note {
  // Strip .md extension for note title
  const title = fileName.replace(/\.md$/i, '');
  const tags = extractTags(fileContent);

  return {
    id: `note-obsidian-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: title,
    content: fileContent,
    folder: folderName,
    tags: tags,
    isEncrypted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: false
  };
}

/**
 * Formats a Knowledge Vault Note into a clean Obsidian-compatible .md string
 */
export function exportToObsidianFormat(note: Note): { fileName: string; content: string } {
  const cleanTitle = note.title.replace(/[\/\\?%*:|"<>]/g, '_');
  const fileName = `${cleanTitle}.md`;
  
  // Format with YAML frontmatter if tags exist
  let content = note.content;
  if (note.tags.length > 0 && !content.startsWith('---')) {
    const yamlHeader = `---\ntags:\n${note.tags.map(t => `  - ${t}`).join('\n')}\n---\n\n`;
    content = yamlHeader + content;
  }

  return { fileName, content };
}

/**
 * Triggers a download of all notes as a structured Obsidian Vault backup JSON / files
 */
export function exportVaultToObsidianZip(notes: Note[], folders: Folder[]) {
  const exportData = notes.map(note => exportToObsidianFormat(note));
  const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(jsonBlob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `obsidian-vault-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
