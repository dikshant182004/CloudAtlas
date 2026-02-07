"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { z } from "zod";
import {
  ResourceCountBarChart,
  type ResourceCountBarChartDatum,
} from "./resource-count-bar-chart";

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
  resourceSummary: z
    .array(
      z.object({
        resourceType: z.string(),
        count: z.number(),
        resources: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            region: z.string().optional(),
            riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
          })
        ),
      })
    )
    .optional(),
  className: z.string().optional(),
});

export type ResourceTableProps = z.infer<typeof resourceTableSchema>;

/**
 * Table for cloud resources. Data via props only; no fetching.
 * Dark-theme friendly. Assistant decides when to render.
 */
export const ResourceTable = React.forwardRef<HTMLDivElement, ResourceTableProps>(
  ({ title, columns, rows, resourceSummary, className }, ref) => {
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

    const derivedResourceSummary = React.useMemo(() => {
      if (resourceSummary && resourceSummary.length > 0) return resourceSummary;
      if (!title || !rows || rows.length === 0) return undefined;

      const inferredType = String(title).split(" ")[0] || "Resources";
      const idIdx = columns.findIndex((c) => c.key === "id" || c.label.toLowerCase() === "resource id");
      const nameIdx = columns.findIndex((c) => c.key === "name" || c.label.toLowerCase() === "name");
      const typeIdx = columns.findIndex(
        (c) => c.key === "type" || c.key === "resourceType" || c.label.toLowerCase() === "type"
      );
      const regionIdx = columns.findIndex((c) => c.key === "region" || c.label.toLowerCase() === "region");
      const riskIdx = columns.findIndex(
        (c) => c.key === "risk" || c.key === "riskLevel" || c.label.toLowerCase() === "risk"
      );

      const toRiskLevel = (v: unknown) => {
        if (v == null) return undefined;
        const s = String(v).toUpperCase();
        if (s === "LOW" || s === "MEDIUM" || s === "HIGH") return s;
        return undefined;
      };

      const grouped = new Map<string, { resourceType: string; resources: any[] }>();

      rows.forEach((r) => {
        const rowType = typeIdx >= 0 && r[typeIdx] != null && String(r[typeIdx]).trim() !== ""
          ? String(r[typeIdx])
          : inferredType;

        const idVal = idIdx >= 0 ? r[idIdx] : null;
        const nameVal = nameIdx >= 0 ? r[nameIdx] : null;
        const regionVal = regionIdx >= 0 ? r[regionIdx] : null;
        const riskVal = riskIdx >= 0 ? r[riskIdx] : null;

        const fallback = nameVal ?? idVal;
        const idStr = fallback == null ? "unknown" : String(fallback);
        const nameStr = fallback == null ? "unknown" : String(fallback);

        if (nameStr === "unknown") return;

        const item = {
          id: idStr,
          name: nameStr,
          region: regionVal == null ? undefined : String(regionVal),
          riskLevel: toRiskLevel(riskVal),
        };

        const existing = grouped.get(rowType);
        if (existing) {
          existing.resources.push(item);
        } else {
          grouped.set(rowType, { resourceType: rowType, resources: [item] });
        }
      });

      return Array.from(grouped.values()).map((g) => ({
        resourceType: g.resourceType,
        count: g.resources.length,
        resources: g.resources,
      }));
    }, [resourceSummary, title, rows, columns]);

    const shouldShowSummaryChart = (derivedResourceSummary?.length ?? 0) > 1;

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-border bg-card/50 overflow-hidden shadow-lg",
          className
        )}
      >
        {shouldShowSummaryChart && (
          <div className="p-3 border-b border-border">
            <ResourceCountBarChart
              data={derivedResourceSummary as ResourceCountBarChartDatum[]}
              orientation="vertical"
            />
          </div>
        )}
        {title && (
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {columns.map((col, j) => (
                  <th
                    key={`${col.key}-${j}`}
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
                    <td key={`${i}-${j}-${col.key}`} className="px-4 py-2.5 text-foreground">
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
