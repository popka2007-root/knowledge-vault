import { Note } from '../../types';

/**
 * Templater Engine for Knowledge Vault
 * Supports variables, dates, and dynamic script evaluators.
 */
export function processTemplate(
  templateText: string,
  noteTitle: string = 'Untitled Note',
  allNotes: Note[] = []
): string {
  const now = new Date();
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getLocalDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const dateStr = getLocalDateString(now);
  const timeStr = now.toTimeString().slice(0, 5);
  const weekdayStr = days[now.getDay()];
  const monthStr = months[now.getMonth()];
  const yearStr = now.getFullYear().toString();
  const uuidStr = Math.random().toString(36).substring(2, 9);

  // Date offsets
  const todayStr = dateStr;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrow);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  // Week number
  const firstJan = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((now.getTime() - firstJan.getTime()) / 86400000) + firstJan.getDay() + 1) / 7);
  const currentWeekStr = `Week ${weekNum}, ${yearStr}`;

  let result = templateText
    // Standard variables
    .replace(/\{\{\s*date\s*\}\}/gi, dateStr)
    .replace(/\{\{\s*time\s*\}\}/gi, timeStr)
    .replace(/\{\{\s*weekday\s*\}\}/gi, weekdayStr)
    .replace(/\{\{\s*month\s*\}\}/gi, monthStr)
    .replace(/\{\{\s*year\s*\}\}/gi, yearStr)
    .replace(/\{\{\s*title\s*\}\}/gi, noteTitle)
    .replace(/\{\{\s*uuid\s*\}\}/gi, uuidStr)
    // Date Functions
    .replace(/\{\{\s*today\s*\}\}/gi, todayStr)
    .replace(/\{\{\s*tomorrow\s*\}\}/gi, tomorrowStr)
    .replace(/\{\{\s*yesterday\s*\}\}/gi, yesterdayStr)
    .replace(/\{\{\s*current_week\s*\}\}/gi, currentWeekStr)
    .replace(/\{\{\s*current_month\s*\}\}/gi, monthStr)
    // Custom Script evaluators
    .replace(/\{\{\s*generate_id\(\)\s*\}\}/gi, `ID-${Date.now()}-${uuidStr}`)
    .replace(/\{\{\s*insert_tasks\(\)\s*\}\}/gi, `- [ ] Task 1: Review project objectives\n- [ ] Task 2: Update documentation\n- [ ] Task 3: Check deadlines`)
    .replace(/\{\{\s*calculate_progress\(\)\s*\}\}/gi, `Progress: 0% [░░░░░░░░░░]`);

  return result;
}

export const DEFAULT_TEMPLATES = [
  {
    id: 'tmpl-daily',
    name: 'Daily Journal Template',
    content: `# Daily Note — {{date}} ({{weekday}})

## 📌 Daily Focus
- [ ] Primary Goal for {{date}}
- [ ] Check urgent tasks

## 📝 Notes & Reflections
Write notes for {{weekday}}, {{month}} {{year}} here...

## 📊 Summary
{{calculate_progress()}}
`
  },
  {
    id: 'tmpl-project',
    name: 'Project Spec Template',
    content: `# Project: {{title}}
Created: {{date}} | Ref: {{generate_id()}}

## 🎯 Objectives
Define main deliverables for {{current_month}}.

## 📋 Action Plan
{{insert_tasks()}}
`
  }
];
