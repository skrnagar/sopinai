import React from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  caption?: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
}

export function DataTable<T>({ caption, columns, rows, rowKey }: DataTableProps<T>) {
  return (
    <div className="rounded-2xl border border-[#101014]/[0.08] dark:border-white/10 bg-white dark:bg-[#101014] overflow-hidden shadow-[0_1px_2px_rgba(16,16,20,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-[#101014]/10 dark:border-white/10 bg-[#F7F7FA] dark:bg-[#101126]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`py-3.5 px-4 sm:px-5 text-xs font-semibold text-[#101014] dark:text-white whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#101014]/[0.08] dark:divide-white/10 text-sm">
            {rows.map((row, idx) => (
              <tr
                key={rowKey(row, idx)}
                className="hover:bg-[#F7F7FA]/70 dark:hover:bg-white/[0.03] transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-3.5 px-4 sm:px-5 text-[#5E5E6E] dark:text-[#B5B5C5] align-top ${
                      col.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                    }`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
