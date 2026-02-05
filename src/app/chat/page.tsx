"use client";

import { CloudAtlasChatShell } from "@/components/cloudatlas/cloudatlas-chat-shell";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";

/**
 * CloudAtlas chat page: AI Cloud Assistant with branding, theme toggle (light default), interactive background, and floating assistant character.
 */
export default function ChatPage() {
  const mcpServers = useMcpServers();

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      mcpServers={mcpServers}
    >
      <CloudAtlasChatShell />
    </TamboProvider>
  );
}
