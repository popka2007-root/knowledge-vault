import { Note, TaskItem } from '../../types';

export interface DataviewQueryResult {
  type: 'list' | 'table';
  headers?: string[];
  rows: (string | number)[][];
  totalCount: number;
}

/**
 * Dataview Query Engine for Knowledge Vault
 * Evaluates queries like:
 * TASK WHERE overdue
 * NOTE WHERE tag = #project SORT BY updatedAt DESC LIMIT 10
 */
export function executeDataviewQuery(
  queryString: string,
  notes: Note[],
  allTasks: TaskItem[] = []
): DataviewQueryResult {
  try {
    const cleanQuery = (queryString || '').trim();
    const lower = cleanQuery.toLowerCase();
    const safeNotes = Array.isArray(notes) ? notes : [];
    const safeTasks = Array.isArray(allTasks) ? allTasks : [];

    // Extract LIMIT if present
    let limit = 100;
    const limitMatch = lower.match(/limit\s+(\d+)/);
    if (limitMatch) {
      const parsedLimit = parseInt(limitMatch[1], 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }

    // 1. Task Queries
    if (lower.includes('task') || lower.includes('задач')) {
      let filteredTasks = [...safeTasks];
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (lower.includes('overdue') || lower.includes('просрочен')) {
        filteredTasks = filteredTasks.filter(t => t && !t.completed && t.dueDate && t.dueDate < todayStr);
      } else if (lower.includes('completed') || lower.includes('выполнен')) {
        filteredTasks = filteredTasks.filter(t => t && t.completed);
      } else if (lower.includes('today') || lower.includes('сегодня')) {
        filteredTasks = filteredTasks.filter(t => t && t.dueDate === todayStr);
      } else if (lower.includes('high') || lower.includes('высокий')) {
        filteredTasks = filteredTasks.filter(t => t && t.priority === 'P1');
      }

      filteredTasks = filteredTasks.slice(0, limit);

      return {
        type: 'table',
        headers: ['Task', 'Status', 'Due Date', 'Priority', 'Project'],
        rows: filteredTasks.map(t => [
          t?.title || 'Untitled Task',
          t?.completed ? '✅ Done' : '⏳ Pending',
          t?.dueDate || 'No Date',
          t?.priority || 'Normal',
          t?.project || 'Unassigned'
        ]),
        totalCount: filteredTasks.length
      };
    }

    // 2. Note / Document Queries
    let filteredNotes = [...safeNotes];

    // Filter by tag
    const tagMatch = lower.match(/tag\s*=\s*['"]?#?([^\s'"]+)/);
    if (tagMatch) {
      const targetTag = tagMatch[1].toLowerCase();
      filteredNotes = filteredNotes.filter(n => 
        n && Array.isArray(n.tags) && n.tags.some(t => typeof t === 'string' && t.toLowerCase() === targetTag)
      );
    }

    // Filter by attachments
    if (lower.includes('attachment') || lower.includes('вложен')) {
      filteredNotes = filteredNotes.filter(n => n && typeof n.content === 'string' && (n.content.toLowerCase().includes('![') || n.content.includes('data:image')));
    }

    // Filter untagged
    if (lower.includes('untagged') || lower.includes('без тегов')) {
      filteredNotes = filteredNotes.filter(n => !n || !Array.isArray(n.tags) || n.tags.length === 0);
    }

    // Sort
    if (lower.includes('sort by created') || lower.includes('order by created')) {
      filteredNotes.sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0));
    } else {
      filteredNotes.sort((a, b) => (b?.updatedAt || 0) - (a?.updatedAt || 0));
    }

    filteredNotes = filteredNotes.slice(0, limit);

    return {
      type: 'table',
      headers: ['Title', 'Folder', 'Tags', 'Last Modified'],
      rows: filteredNotes.map(n => [
        n?.title || 'Untitled Note',
        n?.folder || 'Unfiled',
        n && Array.isArray(n.tags) && n.tags.length > 0 ? n.tags.map(t => `#${t}`).join(', ') : 'None',
        n?.updatedAt && !isNaN(n.updatedAt) ? new Date(n.updatedAt).toLocaleDateString() : 'N/A'
      ]),
      totalCount: filteredNotes.length
    };
  } catch (err) {
    console.error('Dataview query execution error:', err);
    return {
      type: 'table',
      headers: ['Error'],
      rows: [['Query execution error: ' + (err instanceof Error ? err.message : String(err))]],
      totalCount: 0
    };
  }
}
