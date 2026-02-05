import { neo4jHelper, type CloudQueryResult } from '@/lib/neo4j-helper';

/**
 * IAM MCP Tools for CloudAtlas
 * Provides semantic cloud intents for IAM role management
 */

export interface IAMRole {
  name: string;
  arn?: string;
  createDate?: string;
  maxSessionDuration?: number;
  isOverprivileged: boolean;
  riskyPolicies?: string[];
}

/**
 * Enumerate IAM roles
 */
export async function list_iam_roles(): Promise<CloudQueryResult<IAMRole>> {
  const cypher = `
    MATCH (role:IAMRole)
    RETURN 
      role.name as name,
      role.arn as arn,
      role.create_date as createDate,
      role.max_session_duration as maxSessionDuration,
      false as isOverprivileged
    ORDER BY role.name
  `;

  return neo4jHelper.executeQuery<IAMRole>(
    cypher,
    'IAM roles detected in the environment'
  );
}

/**
 * Identify roles with overly broad permissions
 */
export async function find_overprivileged_iam_roles(): Promise<CloudQueryResult<IAMRole>> {
  const cypher = `
    MATCH (role:IAMRole)
    OPTIONAL MATCH (role)-[:ASSUMES_ROLE_POLICY]->(policy:IAMPolicy)
    OPTIONAL MATCH (role)-[:HAS_INLINE_POLICY]->(inline:IAMInlinePolicy)
    OPTIONAL MATCH (role)-[:ATTACHES_MANAGED_POLICY]->(managed:IAMManagedPolicy)
    WITH role, policy, inline, managed,
         // Collect all policy documents
      COALESCE(policy.policy_document, '') + 
      COALESCE(inline.policy_document, '') + 
      COALESCE(managed.policy_document, '') as allPolicies
    WHERE (
      // Check for wildcard actions
      allPolicies CONTAINS '"Action": "*"' OR
      allPolicies CONTAINS '"Action": ["*"]' OR
      allPolicies CONTAINS '"Action": ["*","*' OR
      // Check for wildcard resources
      allPolicies CONTAINS '"Resource": "*"' OR
      allPolicies CONTAINS '"Resource": ["*"]' OR
      allPolicies CONTAINS '"Resource": ["*","*' OR
      // Check for NotResource with wildcards
      allPolicies CONTAINS '"NotResource": "*"' OR
      // Check for administrative access patterns
      allPolicies CONTAINS 'iam:*' OR
      allPolicies CONTAINS '"Effect": "Allow"' AND allPolicies CONTAINS 'AdministratorAccess'
    )
    RETURN 
      role.name as name,
      role.arn as arn,
      role.create_date as createDate,
      role.max_session_duration as maxSessionDuration,
      true as isOverprivileged,
      // List risky policy patterns found
      CASE 
        WHEN allPolicies CONTAINS '"Action": "*"' THEN ['Wildcard Actions']
        WHEN allPolicies CONTAINS '"Resource": "*"' THEN ['Wildcard Resources']
        WHEN allPolicies CONTAINS 'iam:*' THEN ['IAM Full Access']
        WHEN allPolicies CONTAINS 'AdministratorAccess' THEN ['Administrator Access']
        ELSE ['Overprivileged']
      END as riskyPolicies
    ORDER BY role.name
  `;

  return neo4jHelper.executeQuery<IAMRole>(
    cypher,
    'IAM roles with overly permissive policies',
    'HIGH'
  );
}

// Export tool definitions for MCP registration
export const iamTools = {
  list_iam_roles,
  find_overprivileged_iam_roles,
};
