import neo4j, { type Driver, type Record, type Integer } from 'neo4j-driver';

/**
 * Neo4j helper for CloudAtlas MCP tools
 * Provides read-only access to Cartography-populated AWS infrastructure data
 */

export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
}

export interface CloudQueryResult<T = any> {
  summary: string;
  data: T[];
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

class Neo4jHelper {
  private driver: Driver | null = null;
  private config: Neo4jConfig;

  constructor() {
    this.config = {
      uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
      username: process.env.NEO4J_USERNAME || 'neo4j',
      password: process.env.NEO4J_PASSWORD || 'password',
    };
  }

  async connect(): Promise<void> {
    try {
      this.driver = neo4j.driver(
        this.config.uri,
        neo4j.auth.basic(this.config.username, this.config.password)
      );
      
      // Test connection
      const session = this.driver.session();
      await session.run('RETURN 1');
      await session.close();
      
      console.log('Connected to Neo4j successfully');
    } catch (error) {
      console.error('Failed to connect to Neo4j:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }

  async executeQuery<T = any>(
    cypher: string,
    summary: string,
    riskLevel?: CloudQueryResult['riskLevel']
  ): Promise<CloudQueryResult<T>> {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized. Call connect() first.');
    }

    const session = this.driver.session();
    try {
      const result = await session.run(cypher);
      
      const data = result.records.map((record: Record) => {
        // Convert Neo4j Record to plain object, excluding internal properties
        const obj: any = {};
        record.keys.forEach((key: string | number | symbol) => {
          const value = record.get(key);
          if (value && typeof value === 'object' && 'properties' in value) {
            // Handle Neo4j Node objects - extract properties only
            obj[key] = (value as any).properties;
          } else if (value && typeof value === 'object' && 'low' in value && 'high' in value) {
            // Handle Neo4j Integer objects
            obj[key] = (value as any).toNumber();
          } else {
            obj[key] = value;
          }
        });
        return obj;
      });

      return {
        summary,
        data,
        riskLevel,
      };
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      const result = await this.executeQuery(
        'MATCH (n) RETURN count(n) as nodeCount',
        'Test connection - node count'
      );
      return result.data.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const neo4jHelper = new Neo4jHelper();
