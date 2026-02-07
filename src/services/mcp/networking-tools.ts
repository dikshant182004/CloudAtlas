import { neo4jHelper, type CloudQueryResult } from '@/lib/neo4j-helper';

/**
 * Networking MCP Tools for CloudAtlas
 * Provides semantic cloud intents for network exposure detection
 */

export interface ExposedResource {
  id: string;
  type: 'EC2Instance' | 'S3Bucket' | 'LoadBalancer' | 'RDSInstance';
  region?: string;
  exposureType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Cross-service exposure detection (EC2 + S3 + other services)
 */
export async function find_internet_exposed_resources(): Promise<CloudQueryResult<ExposedResource>> {
  const cypher = `
    // Find exposed EC2 instances
    MATCH (ec2:EC2Instance)
    OPTIONAL MATCH (ec2)-[:IN_REGION]->(region:Region)
    OPTIONAL MATCH (ec2)-[:MEMBER_OF_EC2_SECURITY_GROUP]->(sg:EC2SecurityGroup)
    OPTIONAL MATCH (sg)-[:HAS_INGRESS_RULE]->(rule:EC2SecurityGroupIngressRule)
    WHERE (
      ec2.public_ip_address IS NOT NULL OR
      (rule.cidr_blocks IS NOT NULL AND rule.cidr_blocks CONTAINS '0.0.0.0/0') OR
      (rule.ipv4_ranges IS NOT NULL AND rule.ipv4_ranges CONTAINS '0.0.0.0/0')
    )
    RETURN ec2.id as id, 'EC2Instance' as type, COALESCE(region.name, 'unknown') as region, 
           CASE 
             WHEN ec2.public_ip_address IS NOT NULL THEN 'Public IP'
             WHEN rule.cidr_blocks CONTAINS '0.0.0.0/0' THEN 'Open Security Group'
             ELSE 'Unknown Exposure'
           END as exposureType,
           'HIGH' as riskLevel
    
    UNION ALL
    
    // Find exposed S3 buckets
    MATCH (bucket:S3Bucket)
    OPTIONAL MATCH (bucket)-[:IN_REGION]->(region:Region)
    OPTIONAL MATCH (bucket)-[:HAS_BUCKET_POLICY]->(policy:BucketPolicy)
    OPTIONAL MATCH (bucket)-[:HAS_BUCKET_ACL]->(acl:AccessControlList)
    WHERE (
      (acl.grantee = 'AllUsers' OR acl.grantee = 'AuthenticatedUsers') OR
      (policy.policy_document CONTAINS '"Effect": "Allow"' AND 
       (policy.policy_document CONTAINS '"Principal": "*"' OR
        policy.policy_document CONTAINS '"Principal":{"AWS":"*"}' OR
        policy.policy_document CONTAINS '"Principal":"*"')) OR
      (bucket.public_access_blocked = false OR bucket.public_access_blocked IS NULL)
    )
    RETURN bucket.name as id, 'S3Bucket' as type, COALESCE(region.name, 'unknown') as region,
           'Public Bucket Policy/ACL' as exposureType,
           'CRITICAL' as riskLevel
    
    UNION ALL
    
    // Find exposed Load Balancers
    MATCH (lb:LoadBalancer)
    OPTIONAL MATCH (lb)-[:IN_REGION]->(region:Region)
    WHERE lb.scheme = 'internet-facing'
    RETURN lb.arn as id, 'LoadBalancer' as type, COALESCE(region.name, 'unknown') as region,
           'Internet-facing Load Balancer' as exposureType,
           'HIGH' as riskLevel
    
    UNION ALL
    
    // Find exposed RDS instances
    MATCH (rds:RDSInstance)
    OPTIONAL MATCH (rds)-[:IN_REGION]->(region:Region)
    OPTIONAL MATCH (rds)-[:MEMBER_OF_DB_SECURITY_GROUP]->(sg:DBSecurityGroup)
    OPTIONAL MATCH (sg)-[:HAS_INGRESS_RULE]->(rule:DBSecurityGroupIngressRule)
    WHERE (
      rds.publicly_accessible = true OR
      (rule.cidr_blocks IS NOT NULL AND rule.cidr_blocks CONTAINS '0.0.0.0/0')
    )
    RETURN rds.db_instance_arn as id, 'RDSInstance' as type, COALESCE(region.name, 'unknown') as region,
           CASE 
             WHEN rds.publicly_accessible = true THEN 'Public RDS Instance'
             WHEN rule.cidr_blocks CONTAINS '0.0.0.0/0' THEN 'Open Security Group'
             ELSE 'Unknown Exposure'
           END as exposureType,
           'CRITICAL' as riskLevel
    
    ORDER BY riskLevel DESC, type, id
  `;

  return neo4jHelper.executeQuery<ExposedResource>(
    cypher,
    'Resources exposed to the internet',
    'HIGH'
  );
}

// Export tool definitions for MCP registration
export const networkingTools = {
  find_internet_exposed_resources,
};
