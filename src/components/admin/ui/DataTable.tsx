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
  /** Explicação para a tabela vazia: o que esta lista mostra e como ela se enche. */
  empty?: { title: string; description?: string };
}

export default function DataTable({
  columns,
  data,
  className,
  empty,
}: DataTableProps) {
  return (
    <div
      className={twMerge(
        "w-full overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(0,0,0,.04),0_4px_16px_rgba(0,0,0,.04)]",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-amf-ink-900">
          <thead className="text-amf-muted-600 border-b border-amf-border">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={twMerge(
                    "px-5 py-3 text-xs font-medium whitespace-nowrap",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-amf-border">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-amf-muted-600"
                >
                  <p className="font-semibold text-[var(--admin-label)]">{empty?.title ?? "Nada por aqui ainda."}</p>
                  {empty?.description && <p className="mx-auto mt-1 max-w-md text-[13px]">{empty.description}</p>}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id ?? rowIdx}
                  className="transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={twMerge("px-5 py-3.5", col.className)}
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                          ? row[col.accessorKey]
                          : null}
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
