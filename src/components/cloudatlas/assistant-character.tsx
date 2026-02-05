"use client";

import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";
import * as React from "react";

export type AssistantState = "idle" | "thinking" | "tool" | "complete";

function getAssistantState(
  isIdle: boolean,
  stage: string | undefined
): AssistantState {
  if (isIdle || !stage || stage === "IDLE" || stage === "CANCELLED")
    return "idle";
  if (stage === "COMPLETE") return "complete";
  if (
    stage === "FETCHING_CONTEXT" ||
    stage === "HYDRATING_COMPONENT" ||
    stage === "CHOOSING_COMPONENT"
  )
    return "tool";
  return "thinking";
}

export interface AssistantCharacterProps
  extends React.HTMLAttributes<HTMLDivElement> {
  visible?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-14 h-14",
  lg: "w-16 h-16",
};

/**
 * Floating orb: semi-transparent, soft glow, thin lines/nodes orbiting inside.
 * Cyan/teal/purple accents. Idle = float + breathing glow; Thinking = inner lines rotate;
 * Tool = pulse; Response = gentle sparkle/expansion.
 */
export const AssistantCharacter = React.forwardRef<
  HTMLDivElement,
  AssistantCharacterProps
>(({ className, visible = true, size = "sm", ...props }, ref) => {
  const { thread, isIdle } = useTambo();
  const stage = thread?.generationStage;
  const state = getAssistantState(!!isIdle, stage);
  const [playedComplete, setPlayedComplete] = React.useState(false);

  React.useEffect(() => {
    if (state === "complete") {
      setPlayedComplete(true);
      const t = setTimeout(() => setPlayedComplete(false), 700);
      return () => clearTimeout(t);
    }
  }, [state]);

  if (!visible) return null;

  const animationClass =
    state === "idle"
      ? "orb-idle"
      : state === "thinking"
        ? "orb-thinking"
        : state === "tool"
          ? "orb-tool"
          : playedComplete
            ? "orb-complete"
            : "orb-idle";

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center shrink-0 rounded-full",
        "bg-[var(--orb-fill)] border border-[var(--orb-line)]",
        "backdrop-blur-sm transition-all duration-300",
        sizeClasses[size],
        animationClass,
        className
      )}
      style={{
        boxShadow: "0 0 20px var(--orb-glow), inset 0 0 20px var(--orb-fill)",
      }}
      aria-label={`Assistant ${state}`}
      {...props}
    >
      <svg
        viewBox="0 0 40 40"
        className={cn("w-[70%] h-[70%] overflow-visible", state === "thinking" && "orb-inner")}
        fill="none"
        aria-hidden
      >
        {/* Outer ring - thin */}
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="var(--orb-line)"
          strokeWidth="0.8"
          opacity="0.8"
        />
        {/* Orbiting nodes / inner structure */}
        <g stroke="var(--orb-line)" strokeWidth="0.6" opacity="0.9">
          <circle cx="20" cy="8" r="1.2" fill="var(--orb-teal, var(--orb-line))" />
          <circle cx="28" cy="14" r="1" fill="var(--orb-purple, var(--orb-line))" />
          <circle cx="28" cy="26" r="1" fill="var(--orb-line)" />
          <circle cx="20" cy="32" r="1.2" fill="var(--orb-teal, var(--orb-line))" />
          <circle cx="12" cy="26" r="1" fill="var(--orb-line)" />
          <circle cx="12" cy="14" r="1" fill="var(--orb-purple, var(--orb-line))" />
        </g>
        {/* Thin connecting lines (orbit / topology feel) */}
        <g stroke="var(--orb-line)" strokeWidth="0.4" opacity="0.5">
          <line x1="20" y1="8" x2="28" y2="14" />
          <line x1="28" y1="14" x2="28" y2="26" />
          <line x1="28" y1="26" x2="20" y2="32" />
          <line x1="20" y1="32" x2="12" y2="26" />
          <line x1="12" y1="26" x2="12" y2="14" />
          <line x1="12" y1="14" x2="20" y2="8" />
        </g>
        {/* Center dot - soft */}
        <circle
          cx="20"
          cy="20"
          r="2.5"
          fill="var(--orb-line)"
          opacity="0.6"
        />
      </svg>
    </div>
  );
});
AssistantCharacter.displayName = "AssistantCharacter";
