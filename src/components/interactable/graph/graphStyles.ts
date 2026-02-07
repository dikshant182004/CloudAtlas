/**
 * Graph color and styling definitions for NVL Graph Explorer
 */

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  meta: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  meta?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Node type color mapping (Neo4j-inspired)
export const NODE_TYPE_COLORS: Record<string, string> = {
  EC2Instance: '#58a6ff',
  S3Bucket: '#3fb950',
  IAMRole: '#f85149',
  Region: '#6f42c1',
  VPC: '#ec4899',
  SecurityGroup: '#f59e0b',
  EC2SecurityGroup: '#f59e0b',
  LoadBalancer: '#10b981',
  RDSInstance: '#8b5cf6',
  Subnet: '#f97316',
  InternetGateway: '#fbbf24',
  RouteTable: '#a855f7',
  NatGateway: '#06b6d4',
};

// Default color for unknown types
export const DEFAULT_NODE_COLOR = '#6b7280';

// Graph styling constants
export const GRAPH_STYLES = {
  // Node styling
  NODE_RADIUS: 8,
  NODE_SELECTED_RADIUS: 12,
  NODE_HOVER_RADIUS: 10,
  NODE_DIM_COLOR: '#111827',
  
  // Edge styling
  EDGE_WIDTH: 1.5,
  EDGE_SELECTED_WIDTH: 3,
  EDGE_HOVER_WIDTH: 2,
  EDGE_DIM_COLOR: '#111827',
  
  // Colors
  EDGE_COLOR: '#374151',
  EDGE_SELECTED_COLOR: '#60a5fa',
  EDGE_HOVER_COLOR: '#4b5563',
  
  // Visual effects
  SELECTED_GLOW_COLOR: 'rgba(96, 165, 250, 0.3)',
  HOVER_GLOW_COLOR: 'rgba(107, 114, 128, 0.2)',
};

// Get node color by type
export function getNodeColor(nodeType: string): string {
  return NODE_TYPE_COLORS[nodeType] || DEFAULT_NODE_COLOR;
}

// Get node display label
export function getNodeLabel(node: GraphNode): string {
  return node.label || node.id || 'Unknown';
}
