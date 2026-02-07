const neo4j = require('neo4j-driver');

/**
 * Simple Neo4j connection test
 */

async function testNeo4jConnection() {
  console.log('🔗 Testing Neo4j connection...\n');

  try {
    // Connection config
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const username = process.env.NEO4J_USERNAME || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';

    console.log(`Connecting to: ${uri}`);
    console.log(`Username: ${username}`);

    // Create driver
    const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    
    // Test connection
    const session = driver.session();
    const result = await session.run('RETURN 1 as test');
    await session.close();
    
    console.log('✅ Neo4j connection successful!');
    
    // Test some basic queries
    console.log('\n📊 Testing basic queries...');
    
    // Count nodes
    const nodeCountSession = driver.session();
    const nodeResult = await nodeCountSession.run('MATCH (n) RETURN count(n) as count');
    const count = nodeResult.records[0].get('count').toNumber();
    await nodeCountSession.close();
    
    console.log(`   Found ${count} nodes in database`);
    
    // Get node labels
    const labelSession = driver.session();
    // const labelResult = await labelSession.run('CALL db.labels() RETURN label AS label');
    const labelResult = await labelSession.run('CALL db.labels() YIELD label RETURN label');

    const labels = labelResult.records.map(record => record.get('label'));
    await labelSession.close();
    
    console.log(`   Available labels: ${labels.join(', ')}`);
    
    // Sample EC2 instances if they exist
    const ec2Session = driver.session();
    const ec2Result = await ec2Session.run('MATCH (ec2:EC2Instance) RETURN ec2.id as id LIMIT 5');
    const ec2Instances = ec2Result.records.map(record => record.get('id'));
    await ec2Session.close();
    
    if (ec2Instances.length > 0) {
      console.log(`   Sample EC2 instances: ${ec2Instances.join(', ')}`);
    } else {
      console.log('   No EC2 instances found (database may be empty)');
    }
    
    await driver.close();
    console.log('\n🎉 Neo4j test completed successfully!');
    
  } catch (error) {
    console.error('❌ Neo4j connection failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure Neo4j is running on localhost:7687');
      console.log('   Check: http://localhost:7474 in browser');
    } else if (error.message.includes('Authentication')) {
      console.log('\n💡 Check Neo4j credentials in environment variables');
      console.log('   NEO4J_USERNAME, NEO4J_PASSWORD');
    }
  }
}

testNeo4jConnection();
