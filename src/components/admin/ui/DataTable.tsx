import React from "react";
import { twMerge } from "tailwind-merge";

interface DataTableProps {
  columns: {
    header: string;
    accessorKey?: string;
    cell?: (item: any) => React.ReactNode;
    className?: string;
  }[];
  data: any[];
  className?: string;
}

export default function DataTable({ columns, data, className }: DataTableProps) {
  return (
    <div className={twMerge("w-full overflow-hidden rounded-2xl border border-amf-border bg-amf-surface shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-amf-ink-900">
          <thead className="bg-amf-ivory-50 text-amf-muted-600 border-b border-amf-border">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={twMerge("px-6 py-4 font-medium whitespace-nowrap", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-amf-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-amf-muted-600">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-amf-ivory-50/50 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={twMerge("px-6 py-4", col.className)}>
                      {col.cell ? col.cell(row) : col.accessorKey ? row[col.accessorKey] : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
