import { Note, TaskItem } from '../../types';

export interface DataviewQueryResult {
  type: 'list' | 'table';
  headers?: string[];
  rows: (string | number)[][];
  totalCount: number;
}

export interface ParsedDQLQuery {
  type: 'table' | 'list' | 'task';
  fields?: string[];
  from?: string;
  where?: string;
  sortField?: string;
  sortDirection?: 'ASC' | 'DESC';
  limit?: number;
  error?: string;
}

/**
 * Extracts YAML frontmatter properties from note content or merges with note.properties.
 * Supports standard multiline YAML blocks and inline header blocks,
 * including Unicode/Cyrillic property names.
 */
export function parseFrontmatter(
  content: string,
  existingProperties?: Record<string, any>
): Record<string, any> {
  const props: Record<string, any> = {};

  // Copy existingProperties if present
  if (existingProperties && typeof existingProperties === 'object') {
    for (const [k, v] of Object.entries(existingProperties)) {
      if (k) {
        props[k.trim().toLowerCase()] = v;
        props[k.trim()] = v;
      }
    }
  }

  if (!content || typeof content !== 'string') return props;

  const trimmed = content.trim();

  // 1. Check for single-line header format: --- status: active, priority: high ---
  const singleLineMatch = trimmed.match(/^---\s*([^\n\r]+?)\s*---/u);
  if (singleLineMatch) {
    const headerStr = singleLineMatch[1].trim();
    if (headerStr.includes(':')) {
      const pairs = headerStr.split(',');
      for (const pair of pairs) {
        const colonIdx = pair.indexOf(':');
        if (colonIdx !== -1) {
          const key = pair.substring(0, colonIdx).trim();
          let val = pair.substring(colonIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (key) {
            props[key] = val;
            props[key.toLowerCase()] = val;
          }
        }
      }
    }
  }

  // 2. Check for multiline YAML block format:
  // ---
  // key: value
  // ---
  const multiLineMatch = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---/u);
  if (multiLineMatch) {
    const yamlBody = multiLineMatch[1];
    const lines = yamlBody.split(/\r?\n/);
    for (const line of lines) {
      const lineTrimmed = line.trim();
      if (!lineTrimmed || lineTrimmed.startsWith('#')) continue;
      const colonIdx = lineTrimmed.indexOf(':');
      if (colonIdx !== -1) {
        const key = lineTrimmed.substring(0, colonIdx).trim();
        let val = lineTrimmed.substring(colonIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (key) {
          props[key] = val;
          props[key.toLowerCase()] = val;
        }
      }
    }
  }

  return props;
}

/**
 * Extracts a specific frontmatter property value supporting Unicode/Cyrillic property names.
 */
export function extractFrontmatterValue(
  content: string,
  key: string,
  existingProperties?: Record<string, any>
): any {
  const props = parseFrontmatter(content, existingProperties);
  if (!key) return undefined;
  const cleanKey = key.trim();
  return props[cleanKey] ?? props[cleanKey.toLowerCase()];
}

/**
 * Parses DQL query string into structured parameters, validating DQL query commands.
 */
export function parseDQL(queryString: string): ParsedDQLQuery {
  const cleanQuery = (queryString || '').trim();
  if (!cleanQuery) {
    return { type: 'table', error: 'Empty query string' };
  }

  const firstWord = cleanQuery.split(/\s+/)[0].toUpperCase();
  const lowerQuery = cleanQuery.toLowerCase();

  const validCommands = ['TABLE', 'LIST', 'TASK', 'CALENDAR', 'ЗАДАЧ', 'ЗАДАЧИ', 'ТАБЛИЦА', 'СПИСОК', 'FROM', 'WHERE'];
  const isValidCommand = validCommands.some(kw => firstWord === kw || firstWord.startsWith(kw));

  if (!isValidCommand) {
    return {
      type: 'table',
      error: `Unknown DQL query type '${firstWord}'`
    };
  }

  const isTaskQuery = firstWord === 'TASK' || firstWord.startsWith('ЗАДАЧ') || lowerQuery.startsWith('task') || lowerQuery.startsWith('задач');
  const isListQuery = (firstWord === 'LIST' || firstWord === 'СПИСОК') && !isTaskQuery;
  const type = isTaskQuery ? 'task' : (isListQuery ? 'list' : 'table');

  return { type };
}

/**
 * Gets formatted today date string YYYY-MM-DD
 */
function getTodayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Robustly parses a date string into a timestamp for sorting.
 * Valid dates get actual timestamps, invalid non-empty strings sort after valid dates,
 * and missing/undefined dates sort last (for ASC order).
 */
function parseDateToTimestamp(dateStr?: string): number {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.trim()) {
    return 9000000000000; // missing date -> sort last in ASC
  }
  const timestamp = Date.parse(dateStr);
  if (!isNaN(timestamp)) {
    return timestamp;
  }
  return 8000000000000; // invalid date string -> sort after valid dates, before missing
}

/**
 * Helper to match a note or task property against a condition string.
 * Supports Unicode/Cyrillic property keys and values.
 */
function evaluateNoteCondition(
  note: Note,
  props: Record<string, any>,
  condition: string
): boolean {
  if (!note) return false;
  const cond = condition.trim();
  if (!cond) return true;

  const lowerCond = cond.toLowerCase();

  if (lowerCond === 'untagged' || lowerCond === 'without tags') {
    return !Array.isArray(note.tags) || note.tags.length === 0;
  }

  if (lowerCond === 'attachment' || lowerCond === 'has attachment' || lowerCond === 'attachments') {
    return Boolean(typeof note.content === 'string' && (note.content.includes('![') || note.content.includes('data:image')));
  }

  // Key = Value (Unicode/Cyrillic supported)
  const eqMatch = cond.match(/^([\p{L}\p{N}_.-]+)\s*(?:=|==)\s*["']?([^"']+)["']?$/iu);
  if (eqMatch) {
    const rawKey = eqMatch[1].trim();
    const key = rawKey.toLowerCase();
    const targetVal = eqMatch[2].trim().toLowerCase();

    if (key === 'tag' || key === 'tags' || key === 'file.tags') {
      const cleanTarget = targetVal.replace(/^#/, '');
      return Array.isArray(note.tags) && note.tags.some(t => typeof t === 'string' && t.toLowerCase() === cleanTarget);
    }
    if (key === 'folder' || key === 'file.folder') {
      return (note.folder || '').toLowerCase() === targetVal;
    }
    if (key === 'title' || key === 'file.name' || key === 'file.title') {
      return (note.title || '').toLowerCase() === targetVal;
    }
    // Frontmatter property lookup
    const propVal = props[rawKey] ?? props[key];
    if (propVal !== undefined && propVal !== null) {
      return String(propVal).toLowerCase() === targetVal;
    }
    return false;
  }

  // Key != Value (Unicode/Cyrillic supported)
  const neqMatch = cond.match(/^([\p{L}\p{N}_.-]+)\s*!=\s*["']?([^"']+)["']?$/iu);
  if (neqMatch) {
    const rawKey = neqMatch[1].trim();
    const key = rawKey.toLowerCase();
    const targetVal = neqMatch[2].trim().toLowerCase();

    if (key === 'tag' || key === 'tags' || key === 'file.tags') {
      const cleanTarget = targetVal.replace(/^#/, '');
      return !Array.isArray(note.tags) || !note.tags.some(t => typeof t === 'string' && t.toLowerCase() === cleanTarget);
    }
    if (key === 'folder' || key === 'file.folder') {
      return (note.folder || '').toLowerCase() !== targetVal;
    }
    if (key === 'title' || key === 'file.name' || key === 'file.title') {
      return (note.title || '').toLowerCase() !== targetVal;
    }
    const propVal = props[rawKey] ?? props[key];
    if (propVal !== undefined && propVal !== null) {
      return String(propVal).toLowerCase() !== targetVal;
    }
    return true;
  }

  // Key CONTAINS Value (Unicode/Cyrillic supported)
  const containsMatch = cond.match(/^([\p{L}\p{N}_.-]+)\s+CONTAINS\s+["']?([^"']+)["']?$/iu);
  if (containsMatch) {
    const rawKey = containsMatch[1].trim();
    const key = rawKey.toLowerCase();
    const targetVal = containsMatch[2].trim().toLowerCase();

    if (key === 'tag' || key === 'tags' || key === 'file.tags') {
      const cleanTarget = targetVal.replace(/^#/, '');
      return Array.isArray(note.tags) && note.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(cleanTarget));
    }
    if (key === 'title' || key === 'file.name' || key === 'file.title') {
      return (note.title || '').toLowerCase().includes(targetVal);
    }
    if (key === 'content' || key === 'file.content') {
      return (note.content || '').toLowerCase().includes(targetVal);
    }
    const propVal = props[rawKey] ?? props[key];
    if (propVal !== undefined && propVal !== null) {
      return String(propVal).toLowerCase().includes(targetVal);
    }
    return false;
  }

  // Shorthand property check e.g. WHERE active
  const propVal = props[cond] ?? props[lowerCond];
  if (propVal !== undefined && propVal !== null) {
    return Boolean(propVal) && String(propVal).toLowerCase() !== 'false';
  }

  return true;
}

/**
 * Dataview Query Engine for Knowledge Vault
 */
export function executeDataviewQuery(
  queryString: string,
  notes: Note[],
  allTasks: TaskItem[] = []
): DataviewQueryResult {
  try {
    const cleanQuery = (queryString || '').trim();
    if (!cleanQuery) {
      return {
        type: 'table',
        headers: ['Error'],
        rows: [['Empty query string']],
        totalCount: 0
      };
    }

    const lowerQuery = cleanQuery.toLowerCase();
    // Corrupted notes array protection: filter out null/undefined elements
    const safeNotes = Array.isArray(notes) ? notes.filter((n): n is Note => Boolean(n)) : [];

    // Aggregate tasks from allTasks parameter and safeNotes.flatMap(n => n.tasks)
    const notesTasks = safeNotes.flatMap(n => (n && Array.isArray(n.tasks)) ? n.tasks.filter(Boolean) : []);
    const taskMap = new Map<string, TaskItem>();
    if (Array.isArray(allTasks)) {
      for (const t of allTasks) {
        if (t && t.id) taskMap.set(t.id, t);
      }
    }
    for (const t of notesTasks) {
      if (t && t.id && !taskMap.has(t.id)) {
        taskMap.set(t.id, t);
      }
    }
    const safeTasks = Array.from(taskMap.values());

    // Validate DQL command keyword
    const firstWord = cleanQuery.split(/\s+/)[0].toUpperCase();
    const validCommands = ['TABLE', 'LIST', 'TASK', 'CALENDAR', 'ЗАДАЧ', 'ЗАДАЧИ', 'ТАБЛИЦА', 'СПИСОК', 'FROM', 'WHERE'];
    const isValidCommand = validCommands.some(kw => firstWord === kw || firstWord.startsWith(kw));

    if (!isValidCommand) {
      return {
        type: 'table',
        headers: ['Error'],
        rows: [[`Invalid query syntax: Unknown DQL command '${firstWord}'`]],
        totalCount: 0
      };
    }

    // Extract LIMIT if present
    let limit = 100;
    const limitMatch = cleanQuery.match(/LIMIT\s+(-?\d+)/i);
    if (limitMatch) {
      const parsedLimit = parseInt(limitMatch[1], 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }

    // Determine query type: TASK, LIST, or TABLE
    const isTaskQuery = firstWord === 'TASK' || firstWord.startsWith('ЗАДАЧ') || lowerQuery.startsWith('task') || lowerQuery.startsWith('задач');
    const isListQuery = (firstWord === 'LIST' || firstWord === 'СПИСОК') && !isTaskQuery;

    // ==========================================
    // 1. TASK Queries
    // ==========================================
    if (isTaskQuery) {
      let filteredTasks = [...safeTasks];
      const todayStr = getTodayDateStr();

      // FROM #tag filtering for tasks
      const fromMatch = cleanQuery.match(/FROM\s+#?([\p{L}\p{N}_-]+)/iu);
      if (fromMatch) {
        const targetTag = fromMatch[1].toLowerCase();
        filteredTasks = filteredTasks.filter(t => {
          if (!t) return false;
          if (Array.isArray(t.tags) && t.tags.some(tag => typeof tag === 'string' && tag.toLowerCase() === targetTag)) return true;
          if (t.project && t.project.toLowerCase() === targetTag) return true;
          if (t.noteId) {
            const parentNote = safeNotes.find(n => n && n.id === t.noteId);
            if (parentNote && Array.isArray(parentNote.tags) && parentNote.tags.some(tag => typeof tag === 'string' && tag.toLowerCase() === targetTag)) {
              return true;
            }
          }
          return false;
        });
      }

      // Status filtering in TASK query
      const hasCompleted = lowerQuery.includes('where completed = true') || lowerQuery.includes('where completed') || lowerQuery.includes('status = completed') || lowerQuery.includes('status = "completed"') || lowerQuery.includes('completed') || lowerQuery.includes('выполнен');
      const hasPending = lowerQuery.includes('where completed = false') || lowerQuery.includes('where pending') || lowerQuery.includes('status = pending') || lowerQuery.includes('status = "pending"') || lowerQuery.includes('pending');
      const hasOverdue = lowerQuery.includes('where overdue') || lowerQuery.includes('status = overdue') || lowerQuery.includes('status = "overdue"') || lowerQuery.includes('overdue') || lowerQuery.includes('просрочен');
      const hasToday = lowerQuery.includes('where today') || lowerQuery.includes('today') || lowerQuery.includes('сегодня');
      const hasHighPriority = lowerQuery.includes('priority = p1') || lowerQuery.includes('priority = "p1"') || lowerQuery.includes('p1') || lowerQuery.includes('high') || lowerQuery.includes('высокий');

      if (hasOverdue) {
        filteredTasks = filteredTasks.filter(t => {
          if (!t || t.completed || !t.dueDate) return false;
          const ts = Date.parse(t.dueDate);
          if (isNaN(ts)) return false;
          return t.dueDate < todayStr;
        });
      } else if (hasCompleted) {
        filteredTasks = filteredTasks.filter(t => t && t.completed);
      } else if (hasPending) {
        filteredTasks = filteredTasks.filter(t => t && !t.completed);
      } else if (hasToday) {
        filteredTasks = filteredTasks.filter(t => t && t.dueDate === todayStr);
      }

      if (hasHighPriority) {
        filteredTasks = filteredTasks.filter(t => t && t.priority === 'P1');
      }

      // SORT clause for tasks
      const sortMatch = cleanQuery.match(/SORT\s+(BY\s+)?([\p{L}\p{N}_.-]+)\s*(ASC|DESC)?/iu);
      if (sortMatch) {
        const sortField = sortMatch[2].toLowerCase();
        const isDesc = (sortMatch[3] || '').toUpperCase() === 'DESC';
        filteredTasks.sort((a, b) => {
          let valA: any = 0;
          let valB: any = 0;
          if (sortField === 'priority') {
            const pOrder: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };
            valA = pOrder[a?.priority || 'P4'] || 5;
            valB = pOrder[b?.priority || 'P4'] || 5;
          } else if (sortField === 'duedate' || sortField === 'due') {
            valA = parseDateToTimestamp(a?.dueDate);
            valB = parseDateToTimestamp(b?.dueDate);
          } else if (sortField === 'title' || sortField === 'name' || sortField === 'file.name') {
            valA = a?.title || '';
            valB = b?.title || '';
          } else if (sortField === 'createdat' || sortField === 'created') {
            valA = a?.createdAt || 0;
            valB = b?.createdAt || 0;
          }
          if (typeof valA === 'string' && typeof valB === 'string') {
            return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
          }
          return isDesc ? valB - valA : valA - valB;
        });
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
          t?.project || t?.noteTitle || 'Unassigned'
        ]),
        totalCount: filteredTasks.length
      };
    }

    // ==========================================
    // 2. NOTE Queries (LIST & TABLE)
    // ==========================================
    const notesWithProps = safeNotes.map(n => ({
      note: n,
      props: parseFrontmatter(n?.content || '', n?.properties)
    }));

    let filteredItems = notesWithProps;

    // DQL FROM parsing: FROM #tag or FROM "folder"
    const fromMatch = cleanQuery.match(/FROM\s+(#?[\p{L}\p{N}_-]+|"[^"]+")/iu);
    if (fromMatch) {
      let rawFrom = fromMatch[1].trim();
      if (rawFrom.startsWith('"') && rawFrom.endsWith('"')) {
        rawFrom = rawFrom.slice(1, -1);
      }
      if (rawFrom.startsWith('#')) {
        const targetTag = rawFrom.slice(1).toLowerCase();
        filteredItems = filteredItems.filter(item =>
          item.note && Array.isArray(item.note.tags) && item.note.tags.some(t => typeof t === 'string' && t.toLowerCase() === targetTag)
        );
      } else {
        const target = rawFrom.toLowerCase();
        filteredItems = filteredItems.filter(item => {
          const hasTag = item.note && Array.isArray(item.note.tags) && item.note.tags.some(t => typeof t === 'string' && t.toLowerCase() === target);
          const hasFolder = item.note && typeof item.note.folder === 'string' && item.note.folder.toLowerCase() === target;
          return hasTag || hasFolder;
        });
      }
    }

    // DQL WHERE parsing
    const whereMatch = cleanQuery.match(/WHERE\s+(.+?)(?=\s+SORT|\s+LIMIT|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      const conditions = whereClause.split(/\s+AND\s+/i);
      filteredItems = filteredItems.filter(item =>
        item.note && conditions.every(cond => evaluateNoteCondition(item.note, item.props, cond))
      );
    }

    // Tag filter fallback e.g. tag = #tag
    const tagMatch = lowerQuery.match(/tag\s*=\s*['"]?#?([\p{L}\p{N}_-]+)/iu);
    if (tagMatch && !whereMatch) {
      const targetTag = tagMatch[1].toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.note && Array.isArray(item.note.tags) && item.note.tags.some(t => typeof t === 'string' && t.toLowerCase() === targetTag)
      );
    }

    // Attachment filter fallback
    if ((lowerQuery.includes('attachment') || lowerQuery.includes('вложен')) && !whereMatch) {
      filteredItems = filteredItems.filter(item =>
        item.note && typeof item.note.content === 'string' && (item.note.content.includes('![') || item.note.content.includes('data:image'))
      );
    }

    // Untagged filter fallback
    if ((lowerQuery.includes('untagged') || lowerQuery.includes('без тегов')) && !whereMatch) {
      filteredItems = filteredItems.filter(item =>
        !item.note || !Array.isArray(item.note.tags) || item.note.tags.length === 0
      );
    }

    // DQL SORT parsing: SORT field ASC/DESC
    const sortMatch = cleanQuery.match(/SORT\s+(BY\s+)?([\p{L}\p{N}_.-]+)\s*(ASC|DESC)?/iu);
    if (sortMatch) {
      const rawSortField = sortMatch[2];
      const sortField = rawSortField.toLowerCase();
      const isDesc = (sortMatch[3] || '').toUpperCase() === 'DESC';

      filteredItems.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (sortField === 'file.name' || sortField === 'name' || sortField === 'title') {
          valA = a.note?.title || '';
          valB = b.note?.title || '';
        } else if (sortField === 'file.mtime' || sortField === 'mtime' || sortField === 'updatedat') {
          valA = a.note?.updatedAt || 0;
          valB = b.note?.updatedAt || 0;
        } else if (sortField === 'file.ctime' || sortField === 'ctime' || sortField === 'createdat') {
          valA = a.note?.createdAt || 0;
          valB = b.note?.createdAt || 0;
        } else if (sortField === 'folder' || sortField === 'file.folder') {
          valA = a.note?.folder || '';
          valB = b.note?.folder || '';
        } else {
          // Frontmatter property lookup
          valA = a.props[rawSortField] ?? a.props[sortField] ?? '';
          valB = b.props[rawSortField] ?? b.props[sortField] ?? '';
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
          return isDesc ? valB - valA : valA - valB;
        }
        const strA = String(valA);
        const strB = String(valB);
        return isDesc ? strB.localeCompare(strA) : strA.localeCompare(strB);
      });
    } else {
      // Default: sort by updatedAt DESC
      filteredItems.sort((a, b) => (b.note?.updatedAt || 0) - (a.note?.updatedAt || 0));
    }

    filteredItems = filteredItems.slice(0, limit);

    // Render LIST Query Result
    if (isListQuery) {
      return {
        type: 'list',
        headers: ['File'],
        rows: filteredItems.map(item => [item.note?.title || 'Untitled']),
        totalCount: filteredItems.length
      };
    }

    // Render TABLE Query Result
    let rawFields: string[] = ['file.name', 'file.mtime', 'tags'];

    const afterTable = cleanQuery.replace(/^(?:TABLE|ТАБЛИЦА)\b/i, '').trim();
    const firstKeywordMatch = afterTable.match(/^(.*?)(?=\b(?:FROM|WHERE|SORT|LIMIT)\b|$)/i);
    if (firstKeywordMatch) {
      const fieldsStr = firstKeywordMatch[1].trim();
      if (fieldsStr) {
        const parsedFields = fieldsStr.split(',').map(f => f.trim()).filter(Boolean);
        if (parsedFields.length > 0) {
          rawFields = parsedFields;
        }
      }
    }

    const headers = rawFields.map(f => {
      const lowerF = f.toLowerCase();
      if (lowerF === 'file.name' || lowerF === 'file.title' || lowerF === 'title') return 'Title';
      if (lowerF === 'file.mtime' || lowerF === 'mtime') return 'Last Modified';
      if (lowerF === 'file.ctime' || lowerF === 'ctime') return 'Created Date';
      if (lowerF === 'file.folder' || lowerF === 'folder') return 'Folder';
      if (lowerF === 'tags' || lowerF === 'file.tags') return 'Tags';
      return f;
    });

    const rows = filteredItems.map(item => {
      const n = item.note;
      const props = item.props;
      const formattedDate = n?.updatedAt ? new Date(n.updatedAt).toLocaleDateString() : 'Unknown';
      const formattedCreated = n?.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Unknown';
      const tagsStr = (n?.tags || []).map(t => `#${t}`).join(', ') || 'No tags';

      return rawFields.map(f => {
        const lowerF = f.toLowerCase();
        if (lowerF === 'file.name' || lowerF === 'file.title' || lowerF === 'title') return n?.title || 'Untitled';
        if (lowerF === 'file.mtime' || lowerF === 'mtime') return formattedDate;
        if (lowerF === 'file.ctime' || lowerF === 'ctime') return formattedCreated;
        if (lowerF === 'file.folder' || lowerF === 'folder') return n?.folder || 'Unfiled';
        if (lowerF === 'tags' || lowerF === 'file.tags') return tagsStr;

        // Dynamic YAML frontmatter property lookup
        const val = props[f] ?? props[lowerF];
        if (val !== undefined && val !== null && val !== '') {
          return String(val);
        }
        return '-';
      });
    });

    return {
      type: 'table',
      headers,
      rows,
      totalCount: filteredItems.length
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
