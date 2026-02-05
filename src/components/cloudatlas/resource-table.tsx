"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { z } from "zod";

const cellValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const resourceTableSchema = z.object({
  title: z.string().optional(),
  columns: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      width: z.string().optional(),
    })
  ),
  /** Row cells in same order as columns; each row is an array of cell values */
  rows: z.array(z.array(cellValueSchema)),
  className: z.string().optional(),
});

export type ResourceTableProps = z.infer<typeof resourceTableSchema>;

/**
 * Table for cloud resources. Data via props only; no fetching.
 * Dark-theme friendly. Assistant decides when to render.
 */
export const ResourceTable = React.forwardRef<HTMLDivElement, ResourceTableProps>(
  ({ title, columns, rows, className }, ref) => {
    if (!columns?.length) {
      return (
        <div
          ref={ref}
          className={cn(
            "rounded-lg border border-border bg-card/50 p-6 min-h-[120px] flex items-center justify-center text-muted-foreground",
            className
          )}
        >
          <span className="text-sm">No columns defined</span>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-border bg-card/50 overflow-hidden shadow-lg",
          className
        )}
      >
        {title && (
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  {columns.map((col, j) => (
                    <td key={col.key} className="px-4 py-2.5 text-foreground">
                      {row[j] != null && row[j] !== "" ? String(row[j]) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!rows || rows.length === 0) && (
          <div className="px-4 py-6 text-center text-muted-foreground text-sm">
            No rows
          </div>
        )}
      </div>
    );
  }
);
ResourceTable.displayName = "ResourceTable";
