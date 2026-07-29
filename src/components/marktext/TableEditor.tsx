import React, { useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface TableEditorProps {
  initialMarkdown: string;
  onUpdateTable: (newMarkdown: string) => void;
}

export const TableEditor: React.FC<TableEditorProps> = ({ initialMarkdown, onUpdateTable }) => {
  // Parse GFM Markdown table
  const lines = initialMarkdown.trim().split('\n').filter(l => l.includes('|'));
  if (lines.length < 2) return null;

  const parseRow = (line: string) => line.split('|').slice(1, -1).map(c => c.trim());

  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow);

  const formatTable = (newHeaders: string[], newRows: string[][]) => {
    const headerLine = `| ${newHeaders.join(' | ')} |`;
    const sepLine = `| ${newHeaders.map(() => '---').join(' | ')} |`;
    const bodyLines = newRows.map(r => `| ${r.join(' | ')} |`).join('\n');
    return `${headerLine}\n${sepLine}\n${bodyLines}`;
  };

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    if (rowIndex === -1) {
      const newHeaders = [...headers];
      newHeaders[colIndex] = val;
      onUpdateTable(formatTable(newHeaders, rows));
    } else {
      const newRows = [...rows];
      newRows[rowIndex] = [...newRows[rowIndex]];
      newRows[rowIndex][colIndex] = val;
      onUpdateTable(formatTable(headers, newRows));
    }
  };

  const addColumn = () => {
    const newHeaders = [...headers, `Column ${headers.length + 1}`];
    const newRows = rows.map(r => [...r, '']);
    onUpdateTable(formatTable(newHeaders, newRows));
  };

  const addRow = () => {
    const newRows = [...rows, new Array(headers.length).fill('')];
    onUpdateTable(formatTable(headers, newRows));
  };

  const removeColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    const newHeaders = headers.filter((_, idx) => idx !== colIdx);
    const newRows = rows.map(r => r.filter((_, idx) => idx !== colIdx));
    onUpdateTable(formatTable(newHeaders, newRows));
  };

  const removeRow = (rowIdx: number) => {
    const newRows = rows.filter((_, idx) => idx !== rowIdx);
    onUpdateTable(formatTable(headers, newRows));
  };

  return (
    <div style={{ margin: '16px 0', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', background: 'var(--bg-tertiary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>MARKTEXT TABLE EDITOR</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={addColumn}>
            <Plus size={12} /> Add Column
          </button>
          <button className="btn" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={addRow}>
            <Plus size={12} /> Add Row
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
                      onChange={(e) => handleCellChange(-1, colIdx, e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 700, width: '100%', outline: 'none' }}
                    />
                    <button className="btn-icon" style={{ padding: '2px' }} onClick={() => removeColumn(colIdx)} title="Delete Column">
                      <Trash2 size={10} color="var(--danger)" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                {row.map((cell, colIdx) => (
                  <td key={colIdx} style={{ padding: '6px 8px', border: '1px solid var(--border-color)' }}>
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
                    />
                  </td>
                ))}
                <td style={{ border: 'none', paddingLeft: '6px' }}>
                  <button className="btn-icon" style={{ padding: '2px' }} onClick={() => removeRow(rowIdx)} title="Delete Row">
                    <Trash2 size={10} color="var(--danger)" />
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
