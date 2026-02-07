import { neo4jHelper, type CloudQueryResult } from '@/lib/neo4j-helper';
import { GraphData } from '@/components/interactable/graph/graphStyles';

/**
 * Graph Visualization MCP Tool for CloudAtlas
 * REQUIRED tool for visualizing cloud infrastructure.
 * 
 * This tool MUST be used whenever user asks to:
 * - show infrastructure
 * - visualize cloud resources  
 * - explore relationships
 * - display a graph
 *
 * The result MUST be rendered using NVLGraphExplorer interactable component.
 * Never summarize this data in text.
 */

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  meta: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  meta?: Record<string, any>;
}

export interface CloudGraphSnapshot {
  summary: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Provide a graph slice suitable for visualization
 * Returns AWS IDs only, never Neo4j internal IDs
 */
export async function get_cloud_graph_snapshot(
  resourceType?: string,
  limit: number = 100
): Promise<CloudGraphSnapshot> {
  // Build the Cypher query based on resource type filter
  let whereClause = '';
  if (resourceType && typeof resourceType === 'string') {
    // Sanitize the resourceType to prevent injection
    const sanitizedType = resourceType.replace(/[^a-zA-Z0-9_]/g, '');
    if (sanitizedType) {
      whereClause = `WHERE node:${sanitizedType}`;
    }
  }

  const cypher = `
    // Get nodes with their properties
    MATCH (node)
    ${whereClause}
    WITH node, labels(node) as nodeLabels
    LIMIT ${limit}
    
    // Get relationships for these nodes
    OPTIONAL MATCH (node)-[rel]->(targetNode)
    
    // Collect nodes and edges separately to maintain scope
    WITH 
      collect(DISTINCT node) + collect(DISTINCT targetNode) as allNodes,
      collect(DISTINCT CASE 
        WHEN rel IS NULL THEN NULL
        ELSE {
          source: COALESCE(
            startNode(rel).id,
            startNode(rel).name,
            startNode(rel).arn,
            startNode(rel).db_instance_arn,
            startNode(rel).vpc_id,
            startNode(rel).subnet_id,
            startNode(rel).security_group_id,
            startNode(rel).internet_gateway_id,
            startNode(rel).nat_gateway_id,
            startNode(rel).route_table_id,
            toString(id(startNode(rel)))
          ),
          target: COALESCE(
            endNode(rel).id,
            endNode(rel).name,
            endNode(rel).arn,
            endNode(rel).db_instance_arn,
            endNode(rel).vpc_id,
            endNode(rel).subnet_id,
            endNode(rel).security_group_id,
            endNode(rel).internet_gateway_id,
            endNode(rel).nat_gateway_id,
            endNode(rel).route_table_id,
            toString(id(endNode(rel)))
          ),
          type: type(rel),
          meta: properties(rel)
        }
      END
      ) as edges
    
    // Process nodes
    UNWIND allNodes as uniqueNode
    WITH uniqueNode, labels(uniqueNode) as uniqueLabels, edges
    
    // Return final structure
    RETURN 
      COLLECT(DISTINCT {
        id: COALESCE(
          uniqueNode.id,
          uniqueNode.name,
          uniqueNode.arn,
          uniqueNode.db_instance_arn,
          uniqueNode.vpc_id,
          uniqueNode.subnet_id,
          uniqueNode.security_group_id,
          uniqueNode.internet_gateway_id,
          uniqueNode.nat_gateway_id,
          uniqueNode.route_table_id,
          toString(id(uniqueNode))
        ),
        type: head(uniqueLabels),
        label: COALESCE(
          uniqueNode.name,
          uniqueNode.id,
          uniqueNode.arn,
          uniqueNode.db_instance_arn,
          uniqueNode.vpc_id,
          uniqueNode.subnet_id,
          uniqueNode.security_group_id,
          uniqueNode.internet_gateway_id,
          uniqueNode.nat_gateway_id,
          uniqueNode.route_table_id,
          toString(id(uniqueNode))
        ),
        meta: properties(uniqueNode)
      }) as nodes,
      edges
  `;

  const result = await neo4jHelper.executeQuery<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  }>(cypher, 'Cloud infrastructure relationship graph');

  // Transform into a single, canonical graph snapshot.
  const first = result.data[0];
  const graphSnapshot: GraphData = {
    nodes: first?.nodes || [],
    edges: (first?.edges || []).filter((edge) => edge !== null),
  };

  return {
    summary: result.summary,
    nodes: graphSnapshot.nodes,
    edges: graphSnapshot.edges,
  };
}

// Export tool definitions for MCP registration
export const graphTools = {
  get_cloud_graph_snapshot,
};
