"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { z } from "zod";

export const cloudGraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string().optional(),
  group: z.string().optional(),
});
export const cloudGraphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
});
export const cloudGraphSchema = z.object({
  nodes: z.array(cloudGraphNodeSchema),
  edges: z.array(cloudGraphEdgeSchema),
  title: z.string().optional(),
  className: z.string().optional(),
});

export type CloudGraphNode = z.infer<typeof cloudGraphNodeSchema>;
export type CloudGraphEdge = z.infer<typeof cloudGraphEdgeSchema>;
export type CloudGraphProps = z.infer<typeof cloudGraphSchema>;

const NODE_R = 20;
const COLORS = [
  "oklch(0.55 0.12 250)",
  "oklch(0.6 0.15 180)",
  "oklch(0.65 0.12 320)",
  "oklch(0.5 0.1 50)",
  "oklch(0.55 0.1 200)",
];

/**
 * Neo4j-style graph: nodes and edges only. Data via props; no fetching.
 * Renders cleanly on dark background. Assistant decides when to render.
 */
export const CloudGraph = React.forwardRef<HTMLDivElement, CloudGraphProps>(
  ({ nodes, edges, title, className }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = React.useState({ w: 400, h: 300 });

    React.useLayoutEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        setDimensions({ w: width, h: height });
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const { w, h } = dimensions;
    const padding = 40;
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) / 2 - padding;

    const nodePositions = React.useMemo(() => {
      const byId = new Map(nodes.map((n) => [n.id, n]));
      const positions: Record<string, { x: number; y: number }> = {};
      nodes.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1) - Math.PI / 2;
        positions[node.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        };
      });
      return positions;
    }, [nodes, centerX, centerY, radius]);

    if (!nodes?.length) {
      return (
        <div
          ref={ref}
          className={cn(
            "rounded-lg border border-border bg-card/50 p-6 min-h-[200px] flex items-center justify-center text-muted-foreground",
            className
          )}
        >
          <span className="text-sm">No graph data yet</span>
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
        <div ref={containerRef} className="w-full h-[320px] relative">
          <svg width={w} height={h} className="overflow-visible">
            {/* Edges */}
            <g>
              {edges.map((edge) => {
                const src = nodePositions[edge.source];
                const tgt = nodePositions[edge.target];
                if (!src || !tgt) return null;
                return (
                  <line
                    key={edge.id}
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke="var(--muted-foreground)"
                    strokeOpacity={0.5}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                );
              })}
            </g>
            {/* Nodes */}
            <g>
              {nodes.map((node, i) => {
                const pos = nodePositions[node.id];
                if (!pos) return null;
                const fill = COLORS[i % COLORS.length];
                return (
                  <g key={node.id}>
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={NODE_R}
                      fill={fill}
                      stroke="var(--border)"
                      strokeWidth={1}
                      className="transition-opacity hover:opacity-90"
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      className="fill-primary-foreground text-xs font-medium"
                      fill="var(--card-foreground)"
                    >
                      {node.label.length > 8 ? node.label.slice(0, 7) + "…" : node.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    );
  }
);
CloudGraph.displayName = "CloudGraph";
