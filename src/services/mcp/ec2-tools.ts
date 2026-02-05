import { neo4jHelper, type CloudQueryResult } from '@/lib/neo4j-helper';

/**
 * EC2 MCP Tools for CloudAtlas
 * Provides semantic cloud intents for EC2 instance management
 */

export interface EC2Instance {
  id: string;
  region: string;
  publicIp?: string;
  isPublic: boolean;
  instanceType?: string;
  state?: string;
}

/**
 * List all EC2 instances in the graph
 */
export async function list_ec2_instances(): Promise<CloudQueryResult<EC2Instance>> {
  const cypher = `
    MATCH (ec2:EC2Instance)
    OPTIONAL MATCH (ec2)-[:IN_REGION]->(region:Region)
    RETURN 
      ec2.id as id,
      region.name as region,
      ec2.public_ip_address as publicIp,
      ec2.instance_type as instanceType,
      ec2.state as state,
      CASE 
        WHEN ec2.public_ip_address IS NOT NULL THEN true
        ELSE false
      END as isPublic
    ORDER BY ec2.id
  `;

  return neo4jHelper.executeQuery<EC2Instance>(
    cypher,
    'All EC2 instances discovered in AWS'
  );
}

/**
 * Identify EC2 instances exposed to the internet
 */
export async function find_public_ec2_instances(): Promise<CloudQueryResult<EC2Instance>> {
  const cypher = `
    MATCH (ec2:EC2Instance)
    OPTIONAL MATCH (ec2)-[:IN_REGION]->(region:Region)
    OPTIONAL MATCH (ec2)-[:MEMBER_OF_EC2_SECURITY_GROUP]->(sg:EC2SecurityGroup)
    OPTIONAL MATCH (sg)-[:HAS_INGRESS_RULE]->(rule:EC2SecurityGroupIngressRule)
    WHERE (
      ec2.public_ip_address IS NOT NULL OR
      (rule.cidr_blocks IS NOT NULL AND rule.cidr_blocks CONTAINS '0.0.0.0/0') OR
      (rule.ipv4_ranges IS NOT NULL AND rule.ipv4_ranges CONTAINS '0.0.0.0/0')
    )
    RETURN 
      ec2.id as id,
      region.name as region,
      ec2.public_ip_address as publicIp,
      ec2.instance_type as instanceType,
      ec2.state as state,
      CASE 
        WHEN ec2.public_ip_address IS NOT NULL THEN true
        ELSE false
      END as isPublic
    ORDER BY ec2.id
  `;

  return neo4jHelper.executeQuery<EC2Instance>(
    cypher,
    'EC2 instances exposed to the public internet',
    'HIGH'
  );
}

// Export tool definitions for MCP registration
export const ec2Tools = {
  list_ec2_instances,
  find_public_ec2_instances,
};
