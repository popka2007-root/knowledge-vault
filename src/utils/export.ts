import { Note } from '../types';

const sanitize = (text: string) => {
  if (!text) return '';
  return text
    .replace(/<(script|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/\bon[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\bon[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\bon[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*'javascript:[^']*'/gi, "$1='#'")
    .replace(/(href|src)\s*=\s*javascript:[^\s>]+/gi, '$1="#"');
};

/**
 * Triggers printing / saving to PDF using browser print dialog
 */
export function exportNoteToPDF(note: Note) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${note.title}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #111; line-height: 1.6; }
          h1 { border-bottom: 2px solid #333; padding-bottom: 8px; }
          img { max-width: 100%; }
        </style>
      </head>
      <body>
        <h1>${sanitize(note.title)}</h1>
        <div>${sanitize(note.content).replace(/\n/g, '<br/>')}</div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Exports a note to standalone HTML file
 */
export function exportNoteToHTML(note: Note) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${note.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #24292f; line-height: 1.6; }
          h1 { border-bottom: 1px solid #d0d7de; padding-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>${sanitize(note.title)}</h1>
        <div>${sanitize(note.content).replace(/\n/g, '<br/>')}</div>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${note.title || 'note'}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
