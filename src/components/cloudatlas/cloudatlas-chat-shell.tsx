"use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import * as React from "react";
import { AssistantCharacter } from "./assistant-character";

const THEME_KEY = "cloudatlas-theme";

export interface CloudAtlasChatShellProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * CloudAtlas chat shell: branding, theme toggle (light default), interactive background, floating assistant.
 * Wraps chat content with header and theme-aware layout.
 */
export function CloudAtlasChatShell({
  children,
  className,
}: CloudAtlasChatShellProps) {
  // Default to light theme for better background visibility; override from localStorage if the user chose dark
  const [dark, setDark] = React.useState(false);
  const [assistantVisible, setAssistantVisible] = React.useState(true);

  React.useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark") setDark(true);
    else if (stored === "light") setDark(false);
    else setDark(false); // default to light theme for better background visibility
  }, []);

  const toggleTheme = React.useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <div
      className={cn(
        "cloudatlas-chat-shell flex flex-col h-screen w-full bg-background text-foreground overflow-hidden",
        dark && "dark",
        className
      )}
    >
      {/* Interactive chat background - behind content */}
      <div
        className="fixed inset-0 -z-10 cloudatlas-chat-bg"
        style={{ zIndex: -1 }}
        aria-hidden
      />

      {/* Header: CloudAtlas branding (theme-aware) + theme toggle */}
      <header
        className={cn(
          "shrink-0 flex items-center justify-between gap-4 px-4 md:px-6 py-3 border-b border-border transition-colors duration-300",
          dark
            ? "bg-[#0d1117]/98 backdrop-blur-md"
            : "bg-background/90 backdrop-blur-sm"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "text-xl font-bold tracking-tight transition-colors",
                dark ? "text-[#58a6ff]" : "text-primary"
              )}
            >
              CloudAtlas
            </span>
            <span
              className={cn(
                "hidden sm:inline text-sm font-normal transition-colors",
                dark ? "text-[#8b949e]" : "text-muted-foreground"
              )}
            >
              AI Cloud Assistant
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className={cn(
            "rounded-lg p-2.5 border transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            dark
              ? "border-[#30363d] text-[#8b949e] hover:text-[#58a6ff] hover:border-[#58a6ff]/40 hover:bg-[#161B22]"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          title={dark ? "Light mode" : "Dark mode"}
        >
          {dark ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </header>

      {/* Main chat area: elevated surface in dark so messages pop */}
      <div className="flex-1 flex min-h-0 relative">
        {children ?? (
          <div
            className={cn(
              "cloudatlas-chat-main flex-1 min-w-0 flex flex-col transition-colors duration-300",
              dark &&
                "bg-[#161b22]/55 border-t border-[#30363d]/60 min-h-0"
            )}
          >
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <MessageThreadFull className="h-full max-w-4xl mx-auto w-full" />
            </div>
          </div>
        )}
      </div>

      {/* Floating assistant orb - fixed, theme-aware */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto">
          {assistantVisible ? (
            <button
              type="button"
              onClick={() => setAssistantVisible(false)}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background block transition-shadow hover:opacity-90"
              aria-label="Hide assistant"
            >
              <AssistantCharacter size="md" className="cursor-pointer" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAssistantVisible(true)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200",
                dark
                  ? "bg-[#161b22] text-[#58a6ff] border border-[#30363d] hover:border-[#58a6ff]/50 hover:bg-[#21262d] shadow-lg shadow-black/20"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary shadow-lg"
              )}
              aria-label="Show assistant"
            >
              <span className="text-xl font-medium">+</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
