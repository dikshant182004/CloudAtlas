import { NextResponse } from "next/server";

import { cloudAtlasMCPTools, initializeMCPTools } from "@/services/mcp";

type ToolName = keyof typeof cloudAtlasMCPTools;

let initPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = initializeMCPTools();
  }
  await initPromise;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      toolName?: string;
      args?: unknown;
    };

    const toolName = body?.toolName;
    if (typeof toolName !== "string" || !(toolName in cloudAtlasMCPTools)) {
      return NextResponse.json(
        { error: "Invalid toolName" },
        { status: 400 },
      );
    }

    await ensureInitialized();

    const tool = cloudAtlasMCPTools[toolName as ToolName] as any;
    const args = body?.args;

    // Support calling tools with no args, a single arg (object/primitive), or spread args (array).
    const result = Array.isArray(args)
      ? await (() => {
          const sanitized = [...args];
          while (
            sanitized.length > 0 &&
            (sanitized[sanitized.length - 1] === null ||
              sanitized[sanitized.length - 1] === undefined)
          ) {
            sanitized.pop();
          }
          return tool(...sanitized);
        })()
      : args === undefined
        ? await tool()
        : await tool(args);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          typeof err?.message === "string" ? err.message : "Tool execution failed",
      },
      { status: 500 },
    );
  }
}
