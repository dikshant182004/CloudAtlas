import { neo4jHelper, type CloudQueryResult } from '@/lib/neo4j-helper';

/**
 * S3 MCP Tools for CloudAtlas
 * Provides semantic cloud intents for S3 bucket management
 */

export interface S3Bucket {
  name: string;
  region: string;
  isPublic: boolean;
  creationDate?: string;
  versioningStatus?: string;
}

/**
 * List all S3 buckets
 */
export async function list_s3_buckets(): Promise<CloudQueryResult<S3Bucket>> {
  const cypher = `
    MATCH (bucket:S3Bucket)
    OPTIONAL MATCH (bucket)-[:IN_REGION]->(region:Region)
    RETURN 
      bucket.name as name,
      COALESCE(region.name, 'unknown') as region,
      bucket.creation_date as creationDate,
      bucket.versioning_status as versioningStatus,
      false as isPublic
    ORDER BY bucket.name
  `;

  return neo4jHelper.executeQuery<S3Bucket>(
    cypher,
    'All S3 buckets in the account'
  );
}

/**
 * Detect publicly accessible S3 buckets
 */
export async function find_public_s3_buckets(): Promise<CloudQueryResult<S3Bucket>> {
  const cypher = `
    MATCH (bucket:S3Bucket)
    OPTIONAL MATCH (bucket)-[:IN_REGION]->(region:Region)
    OPTIONAL MATCH (bucket)-[:HAS_BUCKET_POLICY]->(policy:BucketPolicy)
    OPTIONAL MATCH (bucket)-[:HAS_BUCKET_ACL]->(acl:AccessControlList)
    WHERE (
      // Check for public ACL
      (acl.grantee = 'AllUsers' OR acl.grantee = 'AuthenticatedUsers') OR
      // Check for public policy statements
      (policy.policy_document CONTAINS '"Effect": "Allow"' AND 
       (policy.policy_document CONTAINS '"Principal": "*"' OR
        policy.policy_document CONTAINS '"Principal":{"AWS":"*"}' OR
        policy.policy_document CONTAINS '"Principal":{"AWS":["*"]}' OR
        policy.policy_document CONTAINS '"Principal":"*"')) OR
      // Check for public access block configuration
      (bucket.public_access_blocked = false OR bucket.public_access_blocked IS NULL)
    )
    RETURN 
      bucket.name as name,
      COALESCE(region.name, 'unknown') as region,
      bucket.creation_date as creationDate,
      bucket.versioning_status as versioningStatus,
      true as isPublic
    ORDER BY bucket.name
  `;

  return neo4jHelper.executeQuery<S3Bucket>(
    cypher,
    'Publicly accessible S3 buckets',
    'CRITICAL'
  );
}

// Export tool definitions for MCP registration
export const s3Tools = {
  list_s3_buckets,
  find_public_s3_buckets,
};
