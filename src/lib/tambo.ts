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
  CloudGraph,
  cloudGraphSchema,
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
  cloudAtlasMCPTools, 
  initializeMCPTools,
  toolMetadata 
} from "@/services/mcp";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

// Initialize MCP tools on module load
initializeMCPTools().catch(console.error);

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
    tool: cloudAtlasMCPTools.list_ec2_instances,
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
    description: toolMetadata.find_public_ec2_instances.description,
    tool: cloudAtlasMCPTools.find_public_ec2_instances,
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
    description: toolMetadata.list_s3_buckets.description,
    tool: cloudAtlasMCPTools.list_s3_buckets,
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
    name: toolMetadata.find_public_s3_buckets.name,
    description: toolMetadata.find_public_s3_buckets.description,
    tool: cloudAtlasMCPTools.find_public_s3_buckets,
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
    tool: cloudAtlasMCPTools.list_iam_roles,
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
    tool: cloudAtlasMCPTools.find_overprivileged_iam_roles,
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
    tool: cloudAtlasMCPTools.find_internet_exposed_resources,
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
    description: toolMetadata.get_cloud_graph_snapshot.description,
    tool: cloudAtlasMCPTools.get_cloud_graph_snapshot,
    inputSchema: z.object({
      resourceType: z.string().optional(),
      limit: z.number().optional(),
    }),
    outputSchema: z.object({
      summary: z.string(),
      data: z.array(z.object({
        summary: z.string(),
        nodes: z.array(z.object({
          id: z.string(),
          type: z.string(),
          label: z.string(),
          meta: z.record(z.any()),
        })),
        edges: z.array(z.object({
          source: z.string(),
          target: z.string(),
          type: z.string(),
          meta: z.record(z.any()).optional(),
        })),
      })),
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
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options.",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCard",
    description:
      "A component that displays options as clickable cards with links and summaries with the ability to select multiple items.",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
  {
    name: "CloudGraph",
    description:
      "Neo4j-style graph visualization for cloud infrastructure. Renders nodes and edges. Pass nodes (id, label, type?, group?) and edges (id, source, target, label?). Use for resource relationships, dependency graphs, or topology.",
    component: CloudGraph,
    propsSchema: cloudGraphSchema,
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
