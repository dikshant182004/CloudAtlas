"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

export type ResourceRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface ResourceCountBarChartResource {
  id: string;
  name: string;
  region?: string;
  riskLevel?: ResourceRiskLevel;
}

export interface ResourceCountBarChartDatum {
  resourceType: string;
  count: number;
  resources: ResourceCountBarChartResource[];
}

export interface ResourceCountBarChartProps {
  data: ResourceCountBarChartDatum[];
  className?: string;
  orientation?: "vertical" | "horizontal";
  onResourceClick?: (resource: ResourceCountBarChartResource, resourceType: string) => void;
}

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  EC2: "#0066cc",    // Deep blue
  S3: "#ff6600",     // Deep orange  
  IAM: "#9933cc",    // Deep purple
  RDS: "#00cccc",    // Deep cyan
  VPC: "#ff0066",    // Deep pink
  Region: "#00cc66", // Deep green
  Lambda: "#cccc00", // Deep yellow
  CloudFront: "#cc6600", // Deep amber
  Route53: "#6633cc", // Deep indigo
  SecurityGroup: "#cc0000", // Deep red
  LoadBalancer: "#009999", // Deep teal
  EKS: "#cc00cc",   // Deep magenta
  ECS: "#009900",   // Dark green
  EFS: "#990033",   // Deep rose
};

function getResourceTypeColor(resourceType: string) {
  // Normalize resource type for matching
  const normalizedType = resourceType.toUpperCase().trim();
  
  // Try exact match first
  if (RESOURCE_TYPE_COLORS[normalizedType]) {
    return RESOURCE_TYPE_COLORS[normalizedType];
  }
  
  // Try common variations
  const variations = {
    'EC2': ['EC2', 'AMAZON EC2', 'EC2INSTANCE', 'EC2 INSTANCE'],
    'S3': ['S3', 'AMAZON S3', 'S3BUCKET', 'S3 BUCKET'],
    'IAM': ['IAM', 'AMAZON IAM', 'ROLE', 'USER'],
    'RDS': ['RDS', 'AMAZON RDS', 'RDSINSTANCE', 'RDS INSTANCE'],
    'VPC': ['VPC', 'AMAZON VPC', 'VIRTUAL PRIVATE CLOUD'],
    'LAMBDA': ['LAMBDA', 'AMAZON LAMBDA', 'AWS LAMBDA'],
    'CLOUDFRONT': ['CLOUDFRONT', 'AMAZON CLOUDFRONT', 'CF'],
    'ROUTE53': ['ROUTE53', 'ROUTE 53', 'R53', 'DNS'],
    'SECURITYGROUP': ['SECURITYGROUP', 'SECURITY GROUP', 'SG'],
    'LOADBALANCER': ['LOADBALANCER', 'LOAD BALANCER', 'ELB', 'ALB', 'NLB'],
    'EKS': ['EKS', 'AMAZON EKS', 'KUBERNETES'],
    'ECS': ['ECS', 'AMAZON ECS', 'CONTAINER'],
    'EFS': ['EFS', 'AMAZON EFS', 'FILE SYSTEM']
  };
  
  for (const [baseType, aliases] of Object.entries(variations)) {
    if (aliases.includes(normalizedType)) {
      return RESOURCE_TYPE_COLORS[baseType];
    }
  }
  
  // Generate dynamic color for unmapped types using hash
  let hash = 0;
  for (let i = 0; i < resourceType.length; i++) {
    hash = resourceType.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate vibrant colors using HSL
  const hue = Math.abs(hash) % 360;
  const saturation = 65 + (Math.abs(hash >> 8) % 20); // 65-85%
  const lightness = 45 + (Math.abs(hash >> 16) % 10); // 45-55%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function RiskBadge({ level }: { level: ResourceRiskLevel }) {
  const cls =
    level === "HIGH"
      ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
      : level === "MEDIUM"
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";

  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", cls)}>{level}</span>
  );
}

export function ResourceCountBarChart({
  data,
  className,
  orientation = "vertical",
  onResourceClick,
}: ResourceCountBarChartProps) {
  const [activeType, setActiveType] = React.useState<string | null>(null);

  const maxCount = React.useMemo(() => {
    return Math.max(1, ...(data ?? []).map((d) => d.count ?? 0));
  }, [data]);

  if (!data || data.length === 0) {
    return null;
  }

  const isVertical = orientation === "vertical";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card/50 p-3 shadow-sm",
        "w-full overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-xs font-medium text-foreground">Resource summary</div>
        <div className="text-[11px] text-muted-foreground">Click a bar for details</div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {data.map(d => (
          <div key={d.resourceType} className="flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: getResourceTypeColor(d.resourceType) }} />
            <span className="text-muted-foreground">{d.resourceType}</span>
          </div>
        ))}
      </div>

      <div
        className={cn(
          "w-full",
          isVertical
            ? "flex items-end gap-2 h-28"
            : "flex flex-col gap-2"
        )}
      >
        {data.map((d) => {
          const color = getResourceTypeColor(d.resourceType);
          const ratio = Math.sqrt(Math.min(1, (d.count ?? 0) / maxCount));

          const barStyle = isVertical
            ? ({ height: `${Math.max(4, ratio * 100)}%`, backgroundColor: color } as React.CSSProperties)
            : ({ width: `${Math.max(4, ratio * 100)}%`, backgroundColor: color } as React.CSSProperties);

          return (
            <Popover.Root
              key={d.resourceType}
              open={activeType === d.resourceType}
              onOpenChange={(open) => setActiveType(open ? d.resourceType : null)}
            >
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className={cn(
                    "group relative",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                    "bg-transparent",
                    isVertical
                      ? "flex-1 min-w-[56px] h-full rounded-md border border-border/30"
                      : "w-full rounded-md border border-border/30 p-2"
                  )}
                  aria-label={`${d.resourceType}: ${d.count}`}
                >
                  {isVertical ? (
                    <div className="absolute inset-x-2 bottom-2 flex flex-col items-center gap-1">
                      <div className="w-full rounded-sm transition-opacity duration-150 group-hover:opacity-95" style={barStyle} />
                      <div className="text-[11px] text-muted-foreground truncate">{d.resourceType}</div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="h-2 rounded-sm transition-opacity duration-150 group-hover:opacity-95" style={barStyle} />
                      </div>
                      <div className="shrink-0 text-[11px] text-muted-foreground">
                        {d.resourceType} · {d.count}
                      </div>
                    </div>
                  )}

                  <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="rounded-md border border-border bg-popover px-2 py-1 text-[11px] text-popover-foreground shadow">
                      {d.resourceType}: {d.count}
                    </div>
                  </div>
                </button>
              </Popover.Trigger>

              <Popover.Portal>
                <Popover.Content
                  side={isVertical ? "top" : "right"}
                  align="start"
                  className={cn(
                    "z-50 w-[320px] max-w-[90vw]",
                    "rounded-lg border border-border bg-card p-3 shadow-xl",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {d.resourceType}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Count: <span className="text-card-foreground">{d.count}</span>
                      </div>
                    </div>
                    <div className="w-3 h-3 rounded-sm border border-border" style={{ backgroundColor: color }} />
                  </div>

                  <div className="max-h-56 overflow-y-auto">
                    <div className="space-y-2">
                      {(d.resources ?? []).map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            onResourceClick?.(r, d.resourceType);
                          }}
                          className={cn(
                            "w-full text-left rounded-md border border-border/60 p-2",
                            "hover:bg-muted/40 transition-colors",
                            "focus:outline-none focus:ring-2 focus:ring-ring"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-card-foreground truncate">
                                {r.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono truncate">
                                {r.id}
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2">
                              {r.region ? (
                                <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                                  {r.region}
                                </span>
                              ) : null}
                              {r.riskLevel ? <RiskBadge level={r.riskLevel} /> : null}
                            </div>
                          </div>
                        </button>
                      ))}

                      {(!d.resources || d.resources.length === 0) && (
                        <div className="text-[11px] text-card-muted-foreground">No resources</div>
                      )}
                    </div>
                  </div>

                  <Popover.Arrow className="fill-border" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          );
        })}
      </div>
    </div>
  );
}

// TODO: If/when NVLGraphExplorer exposes a stable public API for selecting/highlighting nodes by id,
// wire onResourceClick to forward the resource id to that API for cross-highlighting.
