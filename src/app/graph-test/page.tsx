"use client";

import React, { useState, useEffect } from "react";
import { NVLGraphExplorer } from "@/components/interactable/graph";
import { GraphData } from "@/components/interactable/graph/graphStyles";

// Sample data matching what the MCP tool returns
const sampleData = {
  nodes: [
    {
      id: "i-1234567890abcdef0",
      type: "EC2Instance",
      label: "web-server-1",
      meta: {
        instance_type: "t3.micro",
        state: "running",
        public_ip: "54.123.45.67",
        region: "us-east-1",
      },
    },
    {
      id: "sg-1234567890abcdef0",
      type: "EC2SecurityGroup",
      label: "web-sg",
      meta: {
        description: "Security group for web servers",
        region: "us-east-1",
      },
    },
    {
      id: "vpc-1234567890abcdef0",
      type: "VPC",
      label: "main-vpc",
      meta: {
        cidr_block: "10.0.0.0/16",
        region: "us-east-1",
      },
    },
  ],
  edges: [
    {
      source: "i-1234567890abcdef0",
      target: "sg-1234567890abcdef0",
      type: "MEMBER_OF_EC2_SECURITY_GROUP",
      meta: {},
    },
    {
      source: "sg-1234567890abcdef0",
      target: "vpc-1234567890abcdef0",
      type: "MEMBER_OF_VPC",
      meta: {},
    },
  ],
};

export default function GraphTestPage() {
  return (
    <div className="h-screen w-full bg-gray-950 p-4">
      <div className="h-full max-w-6xl mx-auto">
        <h1 className="text-white text-2xl mb-4">NVLGraphExplorer Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100%-3rem)]">
          {/* Graph */}
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <NVLGraphExplorer data={sampleData} />
          </div>
        </div>
      </div>
    </div>
  );
}
