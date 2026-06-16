import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "muted" | "success" | "danger" }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 items-center rounded-md px-2 py-1 text-xs font-medium",
        variant === "default" && "bg-[#b20711]/20 text-[#ffb3b7]",
        variant === "muted" && "bg-white/10 text-[#dddddd]",
        variant === "success" && "bg-emerald-500/15 text-emerald-200",
        variant === "danger" && "bg-red-500/15 text-red-200",
        className,
      )}
      {...props}
    />
  );
}
