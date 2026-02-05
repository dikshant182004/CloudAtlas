"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, Shield, Info } from "lucide-react";
import * as React from "react";
import { z } from "zod";

export const riskCardSchema = z.object({
  title: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().optional(),
  resourceId: z.string().optional(),
  resourceType: z.string().optional(),
  count: z.number().optional(),
  className: z.string().optional(),
});

export type RiskCardProps = z.infer<typeof riskCardSchema>;

const severityStyles = {
  low: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400",
  medium: "border-amber-500/40 bg-amber-500/5 text-amber-400",
  high: "border-orange-500/40 bg-orange-500/5 text-orange-400",
  critical: "border-red-500/40 bg-red-500/5 text-red-400",
};

const SeverityIcon = ({ severity }: { severity: RiskCardProps["severity"] }) => {
  switch (severity) {
    case "critical":
    case "high":
      return <AlertTriangle className="w-4 h-4 shrink-0" />;
    case "medium":
      return <Shield className="w-4 h-4 shrink-0" />;
    default:
      return <Info className="w-4 h-4 shrink-0" />;
  }
};

/**
 * Risk summary card for cloud findings. Data via props only.
 * Dark-theme friendly. Assistant decides when to render.
 */
export const RiskCard = React.forwardRef<HTMLDivElement, RiskCardProps>(
  ({ title, severity, description, resourceId, resourceType, count, className }, ref) => {
    const style = severityStyles[severity];

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md",
          style,
          className
        )}
      >
        <div className="flex items-start gap-3">
          <SeverityIcon severity={severity} />
          <div className="min-w-0 flex-1">
            <h4 className="font-medium">{title}</h4>
            {(resourceType || resourceId) && (
              <p className="mt-1 text-xs opacity-80">
                {resourceType}
                {resourceId && ` · ${resourceId}`}
              </p>
            )}
            {description && (
              <p className="mt-2 text-sm opacity-90">{description}</p>
            )}
            {count != null && (
              <p className="mt-2 text-xs opacity-70">Count: {count}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
);
RiskCard.displayName = "RiskCard";
