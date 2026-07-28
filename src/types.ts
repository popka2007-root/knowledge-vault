export type ViewMode = 'notes' | 'canvas' | 'graph' | 'dashboard' | 'calendar' | 'tasks' | 'kanban' | 'trash';
export type Theme = 'dark' | 'light' | 'cyberpunk' | 'sepia';
export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface PageBanner {
  type: 'image' | 'color' | 'gradient' | 'gif' | 'video' | 'random';
  url?: string;
  color?: string;
  parallax?: boolean;
  blur?: number;
  overlayOpacity?: number;
  borderRadius?: number;
}

export interface TaskItem {
  id: string;
  noteId?: string;
  noteTitle?: string;
  title: string;
  completed: boolean;
  dueDate?: string; // YYYY-MM-DD
  startDate?: string;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'none';
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  category?: string;
  project?: string;
  assignee?: string;
  tags?: string[];
  progress?: number; // 0 - 100
  subtasks?: TaskItem[];
  createdAt: number;
  completedAt?: number;
}

export interface Block {
  id: string;
  type: string; // e.g., 'paragraph', 'heading', 'image', 'code', etc.
  content: string;
  children?: string[]; // Array of Block IDs for nesting
  properties?: Record<string, any>; // Optional properties for block-specific data (e.g., heading level, image url)
  checked?: boolean; // For task blocks
}

export interface NoteSnapshot {
  id: string;
  timestamp: number;
  title: string;
  content: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Legacy markdown content
  blocks?: Block[]; // New block-based structure
  folder: string;
  tags: string[];
  isEncrypted: boolean;
  encryptedData?: string;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  pinned?: boolean;
  banner?: PageBanner;
  tasks?: TaskItem[];
  properties?: Record<string, any>;
  isDeleted?: boolean;
  deletedAt?: number;
  history?: NoteSnapshot[];
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  icon?: string;
}

export interface CanvasNode {
  id: string;
  type?: 'card' | 'note' | 'image' | 'pdf' | 'link' | 'text' | 'drawing';
  title: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  noteId?: string;
  drawingData?: string; // Vector/SVG paths for free drawing
  groupId?: string;
}

export interface CanvasConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label?: string;
  type?: 'arrow' | 'line' | 'curved';
}

export interface Canvas {
  id: string;
  title: string;
  nodes: CanvasNode[];
  connections: CanvasConnection[];
  createdAt: number;
  updatedAt: number;
}

export interface DashboardWidget {
  id: string;
  type: 'calendar' | 'tasks_today' | 'deadlines' | 'recent_notes' | 'projects' | 'quick_actions' | 'daily_progress' | 'weekly_stats';
  title: string;
  visible: boolean;
  order: number;
}

export interface BacklinkItem {
  sourceNoteId: string;
  sourceNoteTitle: string;
  snippet: string;
}
