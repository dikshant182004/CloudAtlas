import { neo4jHelper, type CloudQueryResult } from '@/lib/neo4j-helper';

/**
 * Graph Visualization MCP Tool for CloudAtlas
 * Provides graph slices suitable for visualization
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
): Promise<CloudQueryResult<CloudGraphSnapshot>> {
  // Build the Cypher query based on resource type filter
  let whereClause = '';
  if (resourceType) {
    whereClause = `WHERE node:${resourceType}`;
  }

  const cypher = `
    // Get nodes with their properties
    MATCH (node)
    ${whereClause}
    WITH node, labels(node) as nodeLabels
    LIMIT ${limit}
    
    // Get relationships for these nodes
    OPTIONAL MATCH (node)-[rel]->(targetNode)
    WHERE targetNode IN [n IN collect(node) | n]
    
    // Collect all unique nodes
    WITH collect(DISTINCT node) + collect(DISTINCT targetNode) as allNodes
    
    UNWIND allNodes as uniqueNode
    WITH uniqueNode, labels(uniqueNode) as uniqueLabels
    
    // Return nodes and edges
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
      
      COLLECT(DISTINCT {
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
      }) as edges
  `;

  const result = await neo4jHelper.executeQuery<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  }>(cypher, 'Cloud infrastructure relationship graph');

  // Transform the result to match the expected format
  if (result.data.length > 0) {
    const graphData = result.data[0];
    const snapshot: CloudGraphSnapshot = {
      summary: result.summary,
      nodes: graphData.nodes || [],
      edges: graphData.edges || [],
    };

    return {
      summary: result.summary,
      data: [snapshot],
    };
  }

  return {
    summary: result.summary,
    data: [{
      summary: result.summary,
      nodes: [],
      edges: [],
    }],
  };
}

// Export tool definitions for MCP registration
export const graphTools = {
  get_cloud_graph_snapshot,
};
