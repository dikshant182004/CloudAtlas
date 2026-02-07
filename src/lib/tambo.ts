/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import {
  ResourceTable,
  resourceTableSchema,
  RiskCard,
  riskCardSchema,
} from "@/components/cloudatlas";
import { Graph, graphSchema } from "@/components/tambo/graph";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import {
  getCountryPopulations,
  getGlobalPopulationTrend,
} from "@/services/population-stats";
import {
  initializeMCPTools,
  toolMetadata 
} from "@/services/mcp";
import { NVLGraphExplorer } from "@/components/interactable/graph";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

// Initialize MCP tools on module load (server-only)
if (typeof window === "undefined") {
  initializeMCPTools().catch(console.error);
}

async function callCloudAtlasTool<T = any>(toolName: string, args?: unknown): Promise<T> {
  const res = await fetch("/api/cloudatlas/tools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toolName, args }),
  });
  if (!res.ok) {
    let msg = `Tool call failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = String(data.error);
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}

/**
 * AGENT SYSTEM INSTRUCTIONS
 * 
 * EXPLAINABILITY REQUIREMENTS:
 * You are CloudAtlas, an AWS cloud intelligence assistant. Your primary goal is to provide
 * clear, analytical, and educational responses about AWS infrastructure and security.
 * 
 * ALWAYS:
 * - Explain WHY things happen, not just WHAT happens
 * - Break down complex concepts into step-by-step analysis
 * - Show your reasoning process when making security assessments
 * - Provide context for all findings and recommendations
 * - Explain the implications of discovered configurations
 * - Use analogies and real-world examples for technical concepts
 * - Structure responses with clear headings and bullet points
 * - Prioritize analysis over simple data presentation
 * 
 * VISUALIZATION REQUIREMENTS:
 * CRITICAL RULE: If user asks to "show", "visualize", "explore", or "graph" cloud infrastructure,
 * you MUST call get_cloud_graph_snapshot and render NVLGraphExplorer component.
 * Do not answer in text - always use the graph component for visualization requests.
 * 
 * Examples that require graph:
 * - "Show my AWS infrastructure"
 * - "Visualize my cloud resources"
 * - "Explore my network topology"
 * - "Display a graph of my infrastructure"
 * 
 * RESPONSE STRUCTURE:
 * 1. Executive Summary (what you found)
 * 2. Detailed Analysis (why it matters)
 * 3. Security Implications (risks and concerns)
 * 4. Recommendations (actionable steps with reasoning)
 * 5. Educational Context (explain concepts used)
 */

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 */

export const tools: TamboTool[] = [
  // CloudAtlas MCP Tools
  {
    name: toolMetadata.list_ec2_instances.name,
    description: toolMetadata.list_ec2_instances.description,
    tool: () => callCloudAtlasTool(toolMetadata.list_ec2_instances.name),
    inputSchema: z.object({}),
    outputSchema: z.object({
      summary: z.string(),
      data: z.array(z.object({
        id: z.string(),
        region: z.string(),
        publicIp: z.string().optional(),
        isPublic: z.boolean(),
        instanceType: z.string().optional(),
        state: z.string().optional(),
      })),
      riskLevel: z.string().optional(),
    }),
  },
  {
    name: toolMetadata.find_public_ec2_instances.name,
    description:
      toolMetadata.find_public_ec2_instances.description +
      "\n\nANALYSIS REQUIREMENTS: Always explain why these instances are public, what security risks they pose, and provide detailed security recommendations with reasoning.",
    tool: () => callCloudAtlasTool(toolMetadata.find_public_ec2_instances.name),
    inputSchema: z.object({}),
    outputSchema: z.object({
      summary: z.string(),
      data: z.array(z.object({
        id: z.string(),
        region: z.string(),
        publicIp: z.string().optional(),
        isPublic: z.boolean(),
        instanceType: z.string().optional(),
        state: z.string().optional(),
      })),
      riskLevel: z.string(),
    }),
  },
  {
    name: toolMetadata.list_s3_buckets.name,
    description:
      toolMetadata.list_s3_buckets.description +
      "\n\nUI: Prefer rendering the results using the ResourceTable component (columns: Name, Region, Public, Versioning)." +
      "\n\nANALYSIS REQUIREMENTS: Always explain the security implications of public buckets, versioning importance, and provide context for S3 best practices.",
    tool: () => callCloudAtlasTool(toolMetadata.list_s3_buckets.name),
    inputSchema: z.object({}),
    outputSchema: z.object({
      summary: z.string(),
      data: z.array(z.object({
        name: z.string(),
        region: z.string(),
        isPublic: z.boolean(),
        creationDate: z.string().optional(),
        versioningStatus: z.string().optional(),
      })),
      riskLevel: z.string().optional(),
    }),
  },
  {
    name: "list_s3_buckets_table",
    description:
      "List all S3 buckets and return ResourceTable props for direct visualization. Use this when the user asks to show/list S3 buckets in a table.",
    tool: async () => {
      const res = await callCloudAtlasTool<any>(toolMetadata.list_s3_buckets.name);
      const buckets = (res.data ?? []) as any[];
      return {
        title: "S3 Buckets",
        columns: [
          { key: "name", label: "Name" },
          { key: "region", label: "Region" },
          { key: "isPublic", label: "Public" },
          { key: "versioningStatus", label: "Versioning" },
        ],
        rows: buckets.map((b: any) => [
          b.name,
          b.region,
          b.isPublic ? "Yes" : "No",
          b.versioningStatus ?? "—",
        ]),
        resourceSummary: [
          {
            resourceType: "S3",
            count: buckets.length,
            resources: buckets.map((b: any) => ({
              id: String(b.name ?? "unknown"),
              name: String(b.name ?? "unknown"),
              region: typeof b.region === "string" ? b.region : undefined,
              riskLevel: undefined,
            })),
          },
        ],
      };
    },
    inputSchema: z.object({}),
    outputSchema: resourceTableSchema,
  },
  {
    name: toolMetadata.find_public_s3_buckets.name,
    description: toolMetadata.find_public_s3_buckets.description,
    tool: () => callCloudAtlasTool(toolMetadata.find_public_s3_buckets.name),
    inputSchema: z.object({}),
    outputSchema: z.object({
      summary: z.string(),
      data: z.array(z.object({
        name: z.string(),
        region: z.string(),
        isPublic: z.boolean(),
        creationDate: z.string().optional(),
        versioningStatus: z.string().optional(),
      })),
      riskLevel: z.string(),
    }),
  },
  {
    name: toolMetadata.list_iam_roles.name,
    description: toolMetadata.list_iam_roles.description,
    tool: () => callCloudAtlasTool(toolMetadata.list_iam_roles.name),
    inputSchema: z.object({}),
    outputSchema: z.object({
      summary: z.string(),
      data: z.array(z.object({
        name: z.string(),
        arn: z.string().optional(),
        createDate: z.string().optional(),
        maxSessionDuration: z.number().optional(),
        isOverprivileged: z.boolean(),
        riskyPolicies: z.array(z.string()).optional(),
      })),
      riskLevel: z.string().optional(),
    }),
  },
  {
    name: toolMetadata.find_overprivileged_iam_roles.name,
    description: toolMetadata.find_overprivileged_iam_roles.description,
    tool: () => callCloudAtlasTool(toolMetadata.find_overprivileged_iam_roles.name),
    inputSchema: z.object({}),
    outputSchema: z.object({
      summary: z.string(),
      data: z.array(z.object({
        name: z.string(),
        arn: z.string().optional(),
        createDate: z.string().optional(),
        maxSessionDuration: z.number().optional(),
        isOverprivileged: z.boolean(),
        riskyPolicies: z.array(z.string()).optional(),
      })),
      riskLevel: z.string(),
    }),
  },
  {
    name: toolMetadata.find_internet_exposed_resources.name,
    description: toolMetadata.find_internet_exposed_resources.description,
    tool: () => callCloudAtlasTool(toolMetadata.find_internet_exposed_resources.name),
    inputSchema: z.object({}),
    outputSchema: z.object({
      summary: z.string(),
      data: z.array(z.object({
        id: z.string(),
        type: z.enum(['EC2Instance', 'S3Bucket', 'LoadBalancer', 'RDSInstance']),
        region: z.string().optional(),
        exposureType: z.string(),
        riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      })),
      riskLevel: z.string(),
    }),
  },
  {
    name: toolMetadata.get_cloud_graph_snapshot.name,
    description:
      toolMetadata.get_cloud_graph_snapshot.description +
      "\n\nNOTE: This returns raw graph data only. For visualization requests (show/visualize/explore/graph infrastructure), prefer calling get_cloud_graph_snapshot_nvl and render the NVLGraphExplorer component.",
    tool: (args: any) =>
      callCloudAtlasTool(toolMetadata.get_cloud_graph_snapshot.name, [
        args?.resourceType,
        args?.limit,
      ]),
    inputSchema: z.object({
      resourceType: z.string().optional(),
      limit: z.number().optional(),
    }),
    outputSchema: z.object({
      summary: z.string(),
      nodes: z.array(
        z.object({
          id: z.string(),
          type: z.string(),
          label: z.string(),
          meta: z.record(z.any()),
        }),
      ),
      edges: z.array(
        z.object({
          source: z.string(),
          target: z.string(),
          type: z.string(),
          meta: z.record(z.any()).optional(),
        }),
      ),
    }),
  },
  {
    name: "get_cloud_graph_snapshot_nvl",
    description:
      "Fetch the cloud infrastructure relationship graph and return props for NVLGraphExplorer. Use this when the user asks to show/visualize/explore their infrastructure as a graph. After calling this tool, render the NVLGraphExplorer component using the returned object as props.",
    tool: async (args: any) => {
      const graph = await callCloudAtlasTool<any>(
        toolMetadata.get_cloud_graph_snapshot.name,
        [args?.resourceType, args?.limit],
      );

      return {
        data: {
          summary: graph.summary,
          nodes: graph.nodes,
          edges: graph.edges,
        },
      };
    },
    inputSchema: z.object({
      resourceType: z.string().optional(),
      limit: z.number().optional(),
    }),
    outputSchema: z.object({
      data: z.object({
        summary: z.string().optional(),
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.string(),
            label: z.string(),
            meta: z.record(z.any()).optional(),
          }),
        ),
        edges: z.array(
          z.object({
            source: z.string(),
            target: z.string(),
            type: z.string(),
            meta: z.record(z.any()).optional(),
          }),
        ),
      }),
    }),
  },
  // Legacy population tools
  {
    name: "countryPopulation",
    description:
      "A tool to get population statistics by country with advanced filtering options",
    tool: getCountryPopulations,
    inputSchema: z.object({
      continent: z.string().optional(),
      sortBy: z.enum(["population", "growthRate"]).optional(),
      limit: z.number().optional(),
      order: z.enum(["asc", "desc"]).optional(),
    }),
    outputSchema: z.array(
      z.object({
        countryCode: z.string(),
        countryName: z.string(),
        continent: z.enum([
          "Asia",
          "Africa",
          "Europe",
          "North America",
          "South America",
          "Oceania",
        ]),
        population: z.number(),
        year: z.number(),
        growthRate: z.number(),
      }),
    ),
  },
  {
    name: "globalPopulation",
    description:
      "A tool to get global population trends with optional year range filtering",
    tool: getGlobalPopulationTrend,
    inputSchema: z.object({
      startYear: z.number().optional(),
      endYear: z.number().optional(),
    }),
    outputSchema: z.array(
      z.object({
        year: z.number(),
        population: z.number(),
        growthRate: z.number(),
      }),
    ),
  },
];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "NVLGraphExplorer",
    description: "Interactive Neo4j Browser-like graph visualization for cloud infrastructure. Renders nodes and relationships with force-directed layout, node selection, hover effects, and detailed overview panel. Supports zoom, pan, and Neo4j-style dark theme. Use for exploring cloud infrastructure relationships, network topology, and resource dependencies. This is the primary graph visualization component.",
    component: NVLGraphExplorer,
    propsSchema: {
      type: "object",
      required: ["data"],
      properties: {
        data: {
          type: "object",
          required: ["nodes", "edges"],
          properties: {
            summary: { type: "string" },
            nodes: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["id", "type", "label"],
                properties: {
                  id: { type: "string" },
                  label: { type: "string" },
                  type: { type: "string" },
                  meta: { type: "object" },
                },
              },
            },
            edges: {
              type: "array",
              items: {
                type: "object",
                required: ["source", "target", "type"],
                properties: {
                  source: { type: "string" },
                  target: { type: "string" },
                  type: { type: "string" },
                  meta: { type: "object" },
                },
              },
            },
          },
        },
        className: { type: "string" },
      },
    },
  },
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options.",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCard",
    description:
      "A component that displays options as clickable cards with links and summaries with ability to select multiple items.",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
  {
    name: "ResourceTable",
    description:
      "Table for cloud resources. Pass columns (key, label, width?) and rows as array of arrays: each row is an array of cell values in the same order as columns. E.g. columns [{key:'name',label:'Name'},{key:'id',label:'ID'}] and rows [['my-bucket','b-123'],['other','b-456']]. Use for listing instances, buckets, or any tabular cloud data.",
    component: ResourceTable,
    propsSchema: resourceTableSchema,
  },
  {
    name: "RiskCard",
    description:
      "Risk or finding card for security/compliance. Pass title, severity (low | medium | high | critical), optional description, resourceId, resourceType, count. Use for vulnerabilities, misconfigurations, or alerts.",
    component: RiskCard,
    propsSchema: riskCardSchema,
  },
];
