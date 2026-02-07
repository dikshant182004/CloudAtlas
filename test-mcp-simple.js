const { neo4jHelper } = require('./src/lib/neo4j-helper');
const { cloudAtlasMCPTools } = require('./src/services/mcp');

/**
 * Simple test script for MCP tools without TypeScript compilation
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
      if (ec2Instances.data.length > 0) {
        console.log('   Sample instance:', ec2Instances.data[0]);
      }
    } catch (error) {
      console.log(`   ❌ EC2 tools failed: ${error.message}`);
    }

    // Test S3 tools
    console.log('3. Testing S3 tools...');
    try {
      const s3Buckets = await cloudAtlasMCPTools.list_s3_buckets();
      console.log(`   ✅ list_s3_buckets: Found ${s3Buckets.data.length} buckets`);
      if (s3Buckets.data.length > 0) {
        console.log('   Sample bucket:', s3Buckets.data[0]);
      }
    } catch (error) {
      console.log(`   ❌ S3 tools failed: ${error.message}`);
    }

    // Test Graph tools
    console.log('4. Testing Graph tools...');
    try {
      const graph = await cloudAtlasMCPTools.get_cloud_graph_snapshot();
      const snapshot = graph.data[0];
      console.log(`   ✅ get_cloud_graph_snapshot: Found ${snapshot.nodes.length} nodes and ${snapshot.edges.length} edges`);
      if (snapshot.nodes.length > 0) {
        console.log('   Sample node:', snapshot.nodes[0]);
      }
    } catch (error) {
      console.log(`   ❌ Graph tools failed: ${error.message}`);
    }

    console.log('\n🎉 MCP Tools test completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  } finally {
    // Cleanup
    await neo4jHelper.disconnect();
    console.log('🧹 Disconnected from Neo4j');
  }
}

testMCPTools();
