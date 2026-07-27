import { Note, Folder } from '../types';

const DB_NAME = 'KnowledgeVaultDB';
const DB_VERSION = 1;
const STORE_NOTES = 'notes';
const STORE_FOLDERS = 'folders';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NOTES)) {
        db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
        db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' });
      }
    };

    request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

export async function saveNotesToIDB(notes: Note[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NOTES, 'readwrite');
    const store = tx.objectStore(STORE_NOTES);
    
    await new Promise<void>((resolve, reject) => {
      const getKeysReq = store.getAllKeys();
      getKeysReq.onsuccess = () => {
        const existingKeys = getKeysReq.result as string[];
        const newKeys = new Set(notes.map(n => n.id));
        
        let pending = 0;
        let hasError = false;
        
        const checkDone = () => {
          if (pending === 0 && !hasError) resolve();
        };

        const handleError = (e: Event) => {
          if (hasError) return;
          hasError = true;
          reject((e.target as IDBRequest).error);
        };
        
        // Delete removed notes
        existingKeys.forEach(key => {
          if (!newKeys.has(key)) {
            pending++;
            const delReq = store.delete(key);
            delReq.onsuccess = () => { pending--; checkDone(); };
            delReq.onerror = handleError;
          }
        });
        
        // Upsert notes
        notes.forEach(note => {
          pending++;
          const putReq = store.put(note);
          putReq.onsuccess = () => { pending--; checkDone(); };
          putReq.onerror = handleError;
        });
        
        if (pending === 0) resolve();
      };
      getKeysReq.onerror = () => reject(getKeysReq.error);
    });
  } catch (e) {
    console.warn('IndexedDB fallback to LocalStorage:', e);
    localStorage.setItem('kv_notes', JSON.stringify(notes));
  }
}

export async function loadNotesFromIDB(): Promise<Note[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NOTES, 'readonly');
    const store = tx.objectStore(STORE_NOTES);
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const results = req.result as Note[];
        if (results && results.length > 0) {
          resolve(results);
        } else {
          // Fallback to localStorage if IDB is empty
          const fallback = localStorage.getItem('kv_notes');
          resolve(fallback ? JSON.parse(fallback) : []);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    const fallback = localStorage.getItem('kv_notes');
    return fallback ? JSON.parse(fallback) : [];
  }
}
