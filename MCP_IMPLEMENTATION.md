# CloudAtlas MCP Implementation

## Overview
Complete Model Context Protocol (MCP) implementation for CloudAtlas AI cloud infrastructure assistant. Connects Neo4j (populated by Cartography) to Tambo AI, enabling safe, deterministic exploration of AWS infrastructure.

## Architecture

### Core Components
- **Neo4j Helper** (`src/lib/neo4j-helper.ts`) - Database connection and query execution
- **MCP Tools** (`src/services/mcp/`) - Service-specific tool implementations
- **Tool Registry** (`src/services/mcp/index.ts`) - Central registration and initialization
- **Tambo Integration** (`src/lib/tambo.ts`) - Tool registration with Tambo AI

### MCP Tools Implemented

#### 1. EC2 Tools
- `list_ec2_instances` - Lists all EC2 instances with metadata
- `find_public_ec2_instances` - Identifies instances exposed to internet

#### 2. S3 Tools
- `list_s3_buckets` - Lists all S3 buckets
- `find_public_s3_buckets` - Detects publicly accessible buckets

#### 3. IAM Tools
- `list_iam_roles` - Enumerates IAM roles
- `find_overprivileged_iam_roles` - Identifies roles with excessive permissions

#### 4. Networking Tools
- `find_internet_exposed_resources` - Cross-service exposure detection

#### 5. Graph Visualization
- `get_cloud_graph_snapshot` - Provides graph data for Neo4j-style visualization

## Key Features

### Safety & Determinism
✅ **Read-only access** - No mutation capabilities
✅ **Fixed Cypher queries** - No free-form database access
✅ **Structured output** - UI-ready JSON responses
✅ **AWS IDs only** - Never exposes Neo4j internal IDs

### Semantic Cloud Intents
- Tools expose business-level cloud operations
- Abstract away Neo4j internals
- Include risk assessments and summaries
- Support composable workflows

### Integration Ready
- Fully registered with Tambo AI
- TypeScript schemas for all tools
- Auto-initialization on app startup
- Comprehensive test suite

## Environment Setup

### Required Environment Variables
```bash
# Neo4j Connection
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password

# Tambo AI
NEXT_PUBLIC_TAMBO_API_KEY=your_api_key
NEXT_PUBLIC_TAMBO_URL=https://api.tambo.co
```

### Dependencies
- `neo4j-driver` - Neo4j database connectivity
- `@tambo-ai/react` - Tambo AI integration
- `zod` - Schema validation

## Usage

### Testing Tools
```bash
# Run the test suite
npx ts-node src/services/mcp/test-tools.ts
```

### In Chat Interface
The AI assistant can now:
- "Show me all EC2 instances"
- "Find public S3 buckets"
- "Identify overprivileged IAM roles"
- "Get a graph of my cloud infrastructure"
- "What resources are exposed to the internet?"

### Tool Responses
Each tool returns structured JSON:
```json
{
  "summary": "All EC2 instances discovered in AWS",
  "data": [...],
  "riskLevel": "HIGH"
}
```

## File Structure
```
src/
├── lib/
│   ├── neo4j-helper.ts          # Database connection
│   └── tambo.ts                # Tambo integration
├── services/mcp/
│   ├── index.ts                # Tool registry
│   ├── ec2-tools.ts           # EC2 MCP tools
│   ├── s3-tools.ts            # S3 MCP tools
│   ├── iam-tools.ts           # IAM MCP tools
│   ├── networking-tools.ts    # Networking MCP tools
│   ├── graph-tools.ts         # Graph visualization
│   └── test-tools.ts         # Test suite
```

## Compliance with Requirements

✅ **Exactly 5 AWS Services** - EC2, S3, IAM, Networking, Graph Visualization
✅ **Canonical Tool List** - All required tools implemented
✅ **Design Rules** - Fixed queries, structured output, no Neo4j internals
✅ **Safety** - Read-only, deterministic, demo-stable
✅ **UI-Ready** - Returns visualization-ready data structures

The MCP layer is now ready for production use with CloudAtlas AI assistant.
