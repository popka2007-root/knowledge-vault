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

    // 2. Note / Document Queries (Obsidian Dataview DQL Parsing)
    let filteredNotes = [...safeNotes];

    // DQL FROM tag parsing: FROM #tag or FROM #folder
    const fromMatch = cleanQuery.match(/FROM\s+#?([\p{L}\p{N}_-]+)/iu);
    if (fromMatch) {
      const targetTag = fromMatch[1].toLowerCase();
      filteredNotes = filteredNotes.filter(n => 
        n && Array.isArray(n.tags) && n.tags.some(t => typeof t === 'string' && t.toLowerCase() === targetTag)
      );
    }

    // Filter by tag syntax: tag = #tag or tag = tag
    const tagMatch = lower.match(/tag\s*=\s*['"]?#?([\p{L}\p{N}_-]+)/u);
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

    // DQL SORT parsing: SORT file.mtime DESC or SORT file.name ASC
    if (cleanQuery.match(/SORT\s+file\.name\s+ASC/i)) {
      filteredNotes.sort((a, b) => (a?.title || '').localeCompare(b?.title || ''));
    } else if (cleanQuery.match(/SORT\s+file\.name\s+DESC/i)) {
      filteredNotes.sort((a, b) => (b?.title || '').localeCompare(a?.title || ''));
    } else if (cleanQuery.match(/SORT\s+file\.ctime\s+ASC/i)) {
      filteredNotes.sort((a, b) => (a?.createdAt || 0) - (b?.createdAt || 0));
    } else if (cleanQuery.match(/SORT\s+file\.ctime\s+DESC/i)) {
      filteredNotes.sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0));
    } else {
      // Default: sort by last modified timestamp DESC
      filteredNotes.sort((a, b) => (b?.updatedAt || 0) - (a?.updatedAt || 0));
    }

    filteredNotes = filteredNotes.slice(0, limit);

    // Extract dynamic DQL TABLE fields if specified: TABLE file.name, file.mtime, tags
    const tableMatch = cleanQuery.match(/TABLE\s+(.+?)(?=\s+FROM|\s+WHERE|\s+SORT|\s+LIMIT|$)/i);
    let customHeaders = ['Title', 'Last Modified', 'Tags'];

    if (tableMatch && tableMatch[1].trim()) {
      const rawFields = tableMatch[1].split(',').map(f => f.trim());
      if (rawFields.length > 0) {
        customHeaders = rawFields.map(f => {
          if (f === 'file.name' || f === 'file.title') return 'Title';
          if (f === 'file.mtime') return 'Last Modified';
          if (f === 'file.ctime') return 'Created Date';
          if (f === 'tags') return 'Tags';
          return f;
        });
      }
    }

    return {
      type: 'table',
      headers: customHeaders,
      rows: filteredNotes.map(n => {
        const formattedDate = n?.updatedAt ? new Date(n.updatedAt).toLocaleDateString() : 'Unknown';
        const formattedCreated = n?.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Unknown';
        const tagsStr = (n?.tags || []).map(t => `#${t}`).join(', ') || 'No tags';

        return customHeaders.map(h => {
          if (h === 'Title') return n?.title || 'Untitled';
          if (h === 'Last Modified') return formattedDate;
          if (h === 'Created Date') return formattedCreated;
          if (h === 'Tags') return tagsStr;
          return n?.title || 'Untitled';
        });
      }),
      totalCount: filteredNotes.length
    };
  } catch (err) {
    console.error('Failed executing Dataview DQL query:', err);
    return {
      type: 'table',
      headers: ['Error'],
      rows: [['Query execution error: ' + (err instanceof Error ? err.message : String(err))]],
      totalCount: 0
    };
  }
}
