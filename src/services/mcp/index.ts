import { neo4jHelper } from '@/lib/neo4j-helper';
import { ec2Tools } from './ec2-tools';
import { s3Tools } from './s3-tools';
import { iamTools } from './iam-tools';
import { networkingTools } from './networking-tools';
import { graphTools } from './graph-tools';

/**
 * MCP Tool Registry for CloudAtlas
 * Central registration point for all Model Context Protocol tools
 */

// Import all tool types for better TypeScript support
export type EC2Tools = typeof ec2Tools;
export type S3Tools = typeof s3Tools;
export type IAMTools = typeof iamTools;
export type NetworkingTools = typeof networkingTools;
export type GraphTools = typeof graphTools;

// Combined tools object for MCP registration
export const cloudAtlasMCPTools = {
  // EC2 Tools
  ...ec2Tools,
  
  // S3 Tools
  ...s3Tools,
  
  // IAM Tools
  ...iamTools,
  
  // Networking Tools
  ...networkingTools,
  
  // Graph Visualization Tools
  ...graphTools,
};

// Tool metadata for registration and discovery
export const toolMetadata = {
  // EC2 Tools
  list_ec2_instances: {
    name: 'list_ec2_instances',
    description: 'List all EC2 instances in the AWS infrastructure',
    category: 'EC2',
    riskLevel: 'LOW' as const,
  },
  find_public_ec2_instances: {
    name: 'find_public_ec2_instances',
    description: 'Find EC2 instances exposed to the public internet',
    category: 'EC2',
    riskLevel: 'HIGH' as const,
  },
  
  // S3 Tools
  list_s3_buckets: {
    name: 'list_s3_buckets',
    description: 'List all S3 buckets in the AWS account',
    category: 'S3',
    riskLevel: 'LOW' as const,
  },
  find_public_s3_buckets: {
    name: 'find_public_s3_buckets',
    description: 'Find publicly accessible S3 buckets',
    category: 'S3',
    riskLevel: 'CRITICAL' as const,
  },
  
  // IAM Tools
  list_iam_roles: {
    name: 'list_iam_roles',
    description: 'List all IAM roles in the AWS account',
    category: 'IAM',
    riskLevel: 'LOW' as const,
  },
  find_overprivileged_iam_roles: {
    name: 'find_overprivileged_iam_roles',
    description: 'Find IAM roles with overly permissive policies',
    category: 'IAM',
    riskLevel: 'HIGH' as const,
  },
  
  // Networking Tools
  find_internet_exposed_resources: {
    name: 'find_internet_exposed_resources',
    description: 'Find all resources exposed to the internet across services',
    category: 'Networking',
    riskLevel: 'HIGH' as const,
  },
  
  // Graph Tools
  get_cloud_graph_snapshot: {
    name: 'get_cloud_graph_snapshot',
    description: 'Get a graph snapshot of cloud infrastructure relationships',
    category: 'Visualization',
    riskLevel: 'LOW' as const,
  },
};

/**
 * Initialize MCP tools by connecting to Neo4j
 * Call this during application startup
 */
export async function initializeMCPTools(): Promise<void> {
  try {
    await neo4jHelper.connect();
    console.log('CloudAtlas MCP tools initialized successfully');
  } catch (error) {
    console.error('Failed to initialize MCP tools:', error);
    throw error;
  }
}

/**
 * Cleanup MCP tools by disconnecting from Neo4j
 * Call this during application shutdown
 */
export async function cleanupMCPTools(): Promise<void> {
  try {
    await neo4jHelper.disconnect();
    console.log('CloudAtlas MCP tools cleaned up successfully');
  } catch (error) {
    console.error('Failed to cleanup MCP tools:', error);
    throw error;
  }
}

/**
 * Test MCP tools connectivity
 */
export async function testMCPTools(): Promise<boolean> {
  try {
    return await neo4jHelper.testConnection();
  } catch (error) {
    console.error('MCP tools test failed:', error);
    return false;
  }
}

// Export individual tool categories for selective registration
export { ec2Tools, s3Tools, iamTools, networkingTools, graphTools };

// Export the main tools object for Tambo integration
export { cloudAtlasMCPTools as tools };
