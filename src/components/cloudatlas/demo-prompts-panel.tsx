"use client";

import { Copy, Lightbulb } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface DemoPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: "visualization" | "security" | "management";
}

const demoPrompts: DemoPrompt[] = [
  {
    id: "infra-graph",
    title: "Infrastructure Visualization",
    description: "Show complete AWS infrastructure topology",
    category: "visualization",
    prompt: "Show me my complete AWS infrastructure as a visual graph. Display all EC2 instances, S3 buckets, VPCs, and their relationships. Highlight any public resources and security risks."
  },
  {
    id: "internet-exposed",
    title: "Internet-Exposed Resources",
    description: "List all resources exposed to the internet",
    category: "security",
    prompt: "List down all internet-exposed resources in my AWS environment. Show me EC2 instances with public IPs, public S3 buckets, load balancers, and any other resources that are accessible from the internet. Include security risks and recommendations."
  },
  {
    id: "security-scan",
    title: "Security Analysis",
    description: "Analyze security posture and risks",
    category: "security",
    prompt: "Perform a comprehensive security analysis of my AWS environment. Identify all public-facing resources, check for common misconfigurations, and provide prioritized security recommendations with risk levels."
  },
  {
    id: "s3-inventory",
    title: "S3 Bucket Inventory",
    description: "List and analyze all S3 buckets",
    category: "management",
    prompt: "List all my S3 buckets in a detailed table showing their names, regions, public access status, versioning configuration, and any security concerns."
  },
  {
    id: "ec2-instances",
    title: "EC2 Instance Overview",
    description: "Show all EC2 instances with details",
    category: "management",
    prompt: "Show me all my EC2 instances in a table with their instance types, regions, public IP addresses, security groups, and operational status. Highlight any instances that are publicly accessible."
  },
  {
    id: "network-topology",
    title: "Network Analysis",
    description: "Visualize network connections and topology",
    category: "visualization",
    prompt: "Create a detailed network topology graph showing my VPCs, subnets, security groups, and how my EC2 instances are connected. Identify any potential network security issues."
  },
  {
    id: "compliance-check",
    title: "Compliance Assessment",
    description: "Check compliance against security standards",
    category: "security",
    prompt: "Assess my AWS environment against common security frameworks and compliance standards. Provide a detailed report with compliance scores and remediation steps."
  },
  {
    id: "resource-optimization",
    title: "Resource Optimization",
    description: "Identify underutilized resources",
    category: "management",
    prompt: "Analyze my AWS resource utilization and identify underutilized instances, oversized storage, or opportunities for rightsizing. Provide cost savings estimates."
  }
];

const categoryColors = {
  visualization: "bg-blue-500/10 text-blue-600 border-blue-200",
  security: "bg-red-500/10 text-red-600 border-red-200", 
  management: "bg-purple-500/10 text-purple-600 border-purple-200"
};

const categoryIcons = {
  visualization: "📊",
  security: "🔒",
  management: "⚙️"
};

export interface DemoPromptsPanelProps {
  className?: string;
}

export function DemoPromptsPanel({ className }: DemoPromptsPanelProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set(["visualization", "security"]));

  const copyToClipboard = async (prompt: string, id: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy prompt:", err);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const promptsByCategory = React.useMemo(() => {
    const grouped: Record<string, DemoPrompt[]> = {};
    demoPrompts.forEach(prompt => {
      if (!grouped[prompt.category]) {
        grouped[prompt.category] = [];
      }
      grouped[prompt.category].push(prompt);
    });
    return grouped;
  }, []);

  return (
    <div className={cn("h-full flex flex-col bg-background border-l border-border", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Demo Prompts</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Click to use or copy for reference
        </p>
      </div>

      {/* Prompts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(promptsByCategory).map(([category, prompts]) => (
          <div key={category} className="space-y-2">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{categoryIcons[category as keyof typeof categoryIcons]}</span>
                <span className="text-sm font-medium capitalize">{category}</span>
                <span className="text-xs text-muted-foreground">({prompts.length})</span>
              </div>
              <div className={cn(
                "w-4 h-4 transition-transform duration-200",
                expandedCategories.has(category) ? "rotate-90" : ""
              )}>
                ▶
              </div>
            </button>

            {/* Prompts in Category */}
            {expandedCategories.has(category) && (
              <div className="ml-4 space-y-2">
                {prompts.map((demoPrompt) => (
                  <div
                    key={demoPrompt.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
                      categoryColors[demoPrompt.category]
                    )}
                  >
                    {/* Prompt Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-foreground">
                          {demoPrompt.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {demoPrompt.description}
                        </p>
                      </div>
                    </div>

                    {/* Prompt Text Preview */}
                    <div className="mt-2 p-2 bg-background/50 rounded border border-border/50 text-xs font-mono text-muted-foreground max-h-16 overflow-hidden">
                      {demoPrompt.prompt.substring(0, 120)}
                      {demoPrompt.prompt.length > 120 && "..."}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => copyToClipboard(demoPrompt.prompt, demoPrompt.id)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1",
                          "bg-muted hover:bg-muted/80 text-muted-foreground"
                        )}
                      >
                        <Copy className="w-3 h-3" />
                        {copiedId === demoPrompt.id ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/20">
        <p className="text-xs text-muted-foreground text-center">
          These prompts demonstrate CloudAtlas capabilities
        </p>
      </div>
    </div>
  );
}
