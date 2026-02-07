const neo4j = require('neo4j-driver');

/**
 * Direct MCP tools test without imports
 */

async function testMCPToolsDirect() {
  console.log('🚀 Testing MCP Tools Directly...\n');

  try {
    // Connection config
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const username = process.env.NEO4J_USERNAME || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';

    // Create driver
    const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    
    console.log('1. Testing EC2 instances...');
    const ec2Session = driver.session();
    const ec2Result = await ec2Session.run(`
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
      LIMIT 5
    `);
    const ec2Instances = ec2Result.records.map(record => ({
      id: record.get('id'),
      region: record.get('region'),
      publicIp: record.get('publicIp'),
      instanceType: record.get('instanceType'),
      state: record.get('state'),
      isPublic: record.get('isPublic')
    }));
    await ec2Session.close();
    
    console.log(`   ✅ Found ${ec2Instances.length} EC2 instances:`);
    ec2Instances.forEach((instance, i) => {
      console.log(`     ${i+1}. ${instance.id} (${instance.region}) - Public: ${instance.isPublic}`);
    });

    console.log('\n2. Testing S3 buckets...');
    const s3Session = driver.session();
    const s3Result = await s3Session.run(`
      MATCH (bucket:S3Bucket)
      OPTIONAL MATCH (bucket)-[:IN_REGION]->(region:Region)
      RETURN 
        bucket.name as name,
        COALESCE(region.name, 'unknown') as region,
        bucket.creation_date as creationDate,
        false as isPublic
      ORDER BY bucket.name
      LIMIT 5
    `);
    const s3Buckets = s3Result.records.map(record => ({
      name: record.get('name'),
      region: record.get('region'),
      creationDate: record.get('creationDate'),
      isPublic: record.get('isPublic')
    }));
    await s3Session.close();
    
    console.log(`   ✅ Found ${s3Buckets.length} S3 buckets:`);
    s3Buckets.forEach((bucket, i) => {
      console.log(`     ${i+1}. ${bucket.name} (${bucket.region})`);
    });

    console.log('\n3. Testing Graph snapshot...');
    const graphSession = driver.session();
    const graphResult = await graphSession.run(`
      MATCH (ec2:EC2Instance)
      OPTIONAL MATCH (ec2)-[rel]->(target)
      WHERE target:Region OR target:EC2SecurityGroup
      
      WITH
        collect(DISTINCT ec2) + collect(DISTINCT target) AS nodes,
        collect(DISTINCT {
          source: COALESCE(ec2.id, toString(id(ec2))),
          target: COALESCE(target.id, target.name, toString(id(target))),
          type: type(rel)
        }) AS edges
      
      UNWIND nodes AS node
      WITH
        collect(DISTINCT {
          id: COALESCE(node.id, node.name, toString(id(node))),
          type: head(labels(node)),
          label: COALESCE(node.name, node.id, toString(id(node))),
          meta: properties(node)
        }) AS finalNodes,
        edges
      
      RETURN finalNodes AS nodes, edges
      LIMIT 1;
    `);
    
    let nodes = [], edges = [];
    if (graphResult.records.length > 0) {
      const graphData = graphResult.records[0];
      nodes = graphData.get('nodes');
      edges = graphData.get('edges');
    }
    await graphSession.close();
    
    console.log(`   ✅ Graph snapshot: ${nodes.length} nodes, ${edges.length} edges`);
    if (nodes.length > 0) {
      console.log('   Sample nodes:');
      nodes.slice(0, 3).forEach((node, i) => {
        console.log(`     ${i+1}. ${node.label} (${node.type})`);
      });
    }

    await driver.close();
    console.log('\n🎉 MCP Tools test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMCPToolsDirect();
