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
  const cleanQuery = queryString.trim();
  const lower = cleanQuery.toLowerCase();

  // Extract LIMIT if present
  let limit = 100;
  const limitMatch = lower.match(/limit\s+(\d+)/);
  if (limitMatch) {
    limit = parseInt(limitMatch[1], 10);
  }

  // 1. Task Queries
  if (lower.includes('task') || lower.includes('задач')) {
    let filteredTasks = [...allTasks];
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (lower.includes('overdue') || lower.includes('просрочен')) {
      filteredTasks = filteredTasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr);
    } else if (lower.includes('completed') || lower.includes('выполнен')) {
      filteredTasks = filteredTasks.filter(t => t.completed);
    } else if (lower.includes('today') || lower.includes('сегодня')) {
      filteredTasks = filteredTasks.filter(t => t.dueDate === todayStr);
    } else if (lower.includes('high') || lower.includes('высокий')) {
      filteredTasks = filteredTasks.filter(t => t.priority === 'P1');
    }

    filteredTasks = filteredTasks.slice(0, limit);

    return {
      type: 'table',
      headers: ['Task', 'Status', 'Due Date', 'Priority', 'Project'],
      rows: filteredTasks.map(t => [
        t.title,
        t.completed ? '✅ Done' : '⏳ Pending',
        t.dueDate || 'No Date',
        t.priority || 'Normal',
        t.project || 'Unassigned'
      ]),
      totalCount: filteredTasks.length
    };
  }

  // 2. Note / Document Queries
  let filteredNotes = [...notes];

  // Filter by tag
  const tagMatch = lower.match(/tag\s*=\s*#?([^\s]+)/);
  if (tagMatch) {
    const targetTag = tagMatch[1];
    filteredNotes = filteredNotes.filter(n => n.tags.map(t => t.toLowerCase()).includes(targetTag.toLowerCase()));
  }

  // Filter by attachments
  if (lower.includes('attachment') || lower.includes('вложен')) {
    filteredNotes = filteredNotes.filter(n => n.content.includes('!['.toLowerCase()) || n.content.includes('data:image'));
  }

  // Filter untagged
  if (lower.includes('untagged') || lower.includes('без тегов')) {
    filteredNotes = filteredNotes.filter(n => n.tags.length === 0);
  }

  // Sort
  if (lower.includes('sort by created') || lower.includes('order by created')) {
    filteredNotes.sort((a, b) => b.createdAt - a.createdAt);
  } else {
    filteredNotes.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  filteredNotes = filteredNotes.slice(0, limit);

  return {
    type: 'table',
    headers: ['Title', 'Folder', 'Tags', 'Last Modified'],
    rows: filteredNotes.map(n => [
      n.title || 'Untitled Note',
      n.folder || 'Unfiled',
      n.tags.length > 0 ? n.tags.map(t => `#${t}`).join(', ') : 'None',
      new Date(n.updatedAt).toLocaleDateString()
    ]),
    totalCount: filteredNotes.length
  };
}
