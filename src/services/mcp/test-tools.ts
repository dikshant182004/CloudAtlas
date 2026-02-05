import { neo4jHelper } from '@/lib/neo4j-helper';
import { cloudAtlasMCPTools } from '@/services/mcp';

/**
 * Test script for CloudAtlas MCP tools
 * Run this to verify Neo4j connectivity and tool functionality
 */

async function testMCPTools() {
  console.log('🚀 Testing CloudAtlas MCP Tools...\n');

  try {
    // Test Neo4j connection
    console.log('1. Testing Neo4j connection...');
    const connected = await neo4jHelper.testConnection();
    console.log(`   ${connected ? '✅' : '❌'} Neo4j connection: ${connected ? 'Success' : 'Failed'}\n`);

    if (!connected) {
      console.error('❌ Cannot proceed with tool tests - Neo4j connection failed');
      return;
    }

    // Test EC2 tools
    console.log('2. Testing EC2 tools...');
    try {
      const ec2Instances = await cloudAtlasMCPTools.list_ec2_instances();
      console.log(`   ✅ list_ec2_instances: Found ${ec2Instances.data.length} instances`);
      
      const publicEC2 = await cloudAtlasMCPTools.find_public_ec2_instances();
      console.log(`   ✅ find_public_ec2_instances: Found ${publicEC2.data.length} public instances`);
    } catch (error) {
      console.log(`   ❌ EC2 tools failed: ${error}`);
    }

    // Test S3 tools
    console.log('3. Testing S3 tools...');
    try {
      const s3Buckets = await cloudAtlasMCPTools.list_s3_buckets();
      console.log(`   ✅ list_s3_buckets: Found ${s3Buckets.data.length} buckets`);
      
      const publicS3 = await cloudAtlasMCPTools.find_public_s3_buckets();
      console.log(`   ✅ find_public_s3_buckets: Found ${publicS3.data.length} public buckets`);
    } catch (error) {
      console.log(`   ❌ S3 tools failed: ${error}`);
    }

    // Test IAM tools
    console.log('4. Testing IAM tools...');
    try {
      const iamRoles = await cloudAtlasMCPTools.list_iam_roles();
      console.log(`   ✅ list_iam_roles: Found ${iamRoles.data.length} roles`);
      
      const overprivileged = await cloudAtlasMCPTools.find_overprivileged_iam_roles();
      console.log(`   ✅ find_overprivileged_iam_roles: Found ${overprivileged.data.length} overprivileged roles`);
    } catch (error) {
      console.log(`   ❌ IAM tools failed: ${error}`);
    }

    // Test Networking tools
    console.log('5. Testing Networking tools...');
    try {
      const exposed = await cloudAtlasMCPTools.find_internet_exposed_resources();
      console.log(`   ✅ find_internet_exposed_resources: Found ${exposed.data.length} exposed resources`);
    } catch (error) {
      console.log(`   ❌ Networking tools failed: ${error}`);
    }

    // Test Graph tools
    console.log('6. Testing Graph tools...');
    try {
      const graph = await cloudAtlasMCPTools.get_cloud_graph_snapshot();
      const snapshot = graph.data[0];
      console.log(`   ✅ get_cloud_graph_snapshot: Found ${snapshot.nodes.length} nodes and ${snapshot.edges.length} edges`);
    } catch (error) {
      console.log(`   ❌ Graph tools failed: ${error}`);
    }

    console.log('\n🎉 MCP Tools test completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    // Cleanup
    await neo4jHelper.disconnect();
    console.log('🧹 Disconnected from Neo4j');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testMCPTools();
}

export { testMCPTools };
