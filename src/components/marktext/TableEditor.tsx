import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { parseMarkdownTable, formatMarkdownTable } from '../../utils/editorUtils';

interface TableEditorProps {
  initialMarkdown: string;
  onUpdateTable: (newMarkdown: string) => void;
}

export const TableEditor: React.FC<TableEditorProps> = ({ initialMarkdown, onUpdateTable }) => {
  const parsed = parseMarkdownTable(initialMarkdown);
  if (!parsed || parsed.headers.length === 0) return null;

  const { headers, rows } = parsed;

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    if (rowIndex === -1) {
      const newHeaders = [...headers];
      newHeaders[colIndex] = val;
      onUpdateTable(formatMarkdownTable(newHeaders, rows));
    } else {
      const newRows = rows.map((r, rIdx) => {
        if (rIdx !== rowIndex) return r;
        const copy = headers.map((_, cIdx) => r[cIdx] ?? '');
        copy[colIndex] = val;
        return copy;
      });
      onUpdateTable(formatMarkdownTable(headers, newRows));
    }
  };

  const addColumn = () => {
    const newHeaders = [...headers, `Column ${headers.length + 1}`];
    const newRows = rows.map(r => [...headers.map((_, idx) => r[idx] ?? ''), '']);
    onUpdateTable(formatMarkdownTable(newHeaders, newRows));
  };

  const addRow = () => {
    const newRows = [...rows, new Array(headers.length).fill('')];
    onUpdateTable(formatMarkdownTable(headers, newRows));
  };

  const removeColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, idx) => idx !== colIdx);
    const newRows = rows.map(r => r.filter((_, idx) => idx !== colIdx));
    onUpdateTable(formatMarkdownTable(newHeaders, newRows));
  };

  const removeRow = (rowIdx: number) => {
    const newRows = rows.filter((_, idx) => idx !== rowIdx);
    onUpdateTable(formatMarkdownTable(headers, newRows));
  };

  return (
    <div 
      className="gfm-table-editor" 
      style={{ margin: '16px 0', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', background: 'var(--bg-tertiary)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>VISUAL GFM TABLE EDITOR</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={addColumn} aria-label="Add column">
            <Plus size={12} aria-hidden="true" /> Add Column
          </button>
          <button className="btn" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={addRow} aria-label="Add row">
            <Plus size={12} aria-hidden="true" /> Add Row
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
              {headers.map((h, colIdx) => (
                <th key={colIdx} style={{ padding: '8px', textAlign: 'left', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <input
                      type="text"
                      value={h}
                      aria-label={`Header ${colIdx + 1}`}
                      onChange={(e) => handleCellChange(-1, colIdx, e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 700, width: '100%', outline: 'none' }}
                    />
                    <button className="btn-icon" style={{ padding: '2px' }} onClick={() => removeColumn(colIdx)} title="Delete Column" aria-label={`Delete column ${colIdx + 1}`}>
                      <Trash2 size={10} color="var(--danger)" aria-hidden="true" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                {headers.map((_, colIdx) => {
                  const cell = row[colIdx] ?? '';
                  return (
                    <td key={colIdx} style={{ padding: '6px 8px', border: '1px solid var(--border-color)' }}>
                      <input
                        type="text"
                        value={cell}
                        aria-label={`Row ${rowIdx + 1} Column ${colIdx + 1}`}
                        onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
                      />
                    </td>
                  );
                })}
                <td style={{ border: 'none', paddingLeft: '6px' }}>
                  <button className="btn-icon" style={{ padding: '2px' }} onClick={() => removeRow(rowIdx)} title="Delete Row" aria-label={`Delete row ${rowIdx + 1}`}>
                    <Trash2 size={10} color="var(--danger)" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
