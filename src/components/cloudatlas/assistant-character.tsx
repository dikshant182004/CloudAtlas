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
 * AWS-inspired cloud intelligence assistant character.
 * Features a curved arrow forming a subtle smile, representing cloud guidance and expertise.
 * Clean, professional design with AWS orange accent and intelligent energy indicators.
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
      ? "assistant-idle"
      : state === "thinking"
        ? "assistant-thinking"
        : state === "tool"
          ? "assistant-tool"
          : playedComplete
            ? "assistant-complete"
            : "assistant-idle";

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center shrink-0 rounded-full",
        "bg-gradient-to-br from-slate-900 to-slate-800 border border-orange-500/30",
        "backdrop-blur-sm transition-all duration-300",
        sizeClasses[size],
        animationClass,
        className
      )}
      style={{
        boxShadow: "0 0 30px rgba(255, 153, 0, 0.15), inset 0 0 20px rgba(15, 23, 42, 0.5)",
      }}
      aria-label={`Assistant ${state}`}
      {...props}
    >
      <svg
        viewBox="0 0 40 40"
        className={cn("w-[80%] h-[80%] overflow-visible", state === "thinking" && "assistant-inner")}
        fill="none"
        aria-hidden
      >
        {/* AWS-inspired curved arrow forming subtle smile */}
        <g stroke="#FF9900" strokeWidth="2" fill="none" opacity="0.9">
          {/* Main arrow curve - forms the "smile" */}
          <path
            d="M 8 25 Q 20 32 32 25"
            strokeLinecap="round"
            className={state === "thinking" ? "assistant-arrow-curve" : ""}
          />
          {/* Arrow head */}
          <path
            d="M 32 25 L 29 22 M 32 25 L 30 28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        
        {/* Intelligence indicators - soft dots */}
        <g fill="#FF9900" opacity="0.6">
          <circle cx="12" cy="18" r="1.5" className={state === "thinking" ? "assistant-pulse-1" : ""} />
          <circle cx="28" cy="18" r="1.5" className={state === "thinking" ? "assistant-pulse-2" : ""} />
          <circle cx="20" cy="12" r="1" className={state === "thinking" ? "assistant-pulse-3" : ""} />
        </g>
        
        {/* Energy lines - subtle connections */}
        <g stroke="#FF9900" strokeWidth="0.5" opacity="0.4">
          <line x1="12" y1="18" x2="20" y2="12" className={state === "thinking" ? "assistant-energy-line" : ""} />
          <line x1="28" y1="18" x2="20" y2="12" className={state === "thinking" ? "assistant-energy-line-2" : ""} />
        </g>
        
        {/* Core indicator - represents cloud intelligence */}
        <circle
          cx="20"
          cy="20"
          r="3"
          fill="#FF9900"
          opacity="0.8"
          className={state === "complete" ? "assistant-core-glow" : ""}
        />
      </svg>
    </div>
  );
});
AssistantCharacter.displayName = "AssistantCharacter";
