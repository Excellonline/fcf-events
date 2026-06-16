import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 min-w-0 w-full rounded-md border border-white/10 bg-[#0b0b0b] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#666666] focus:border-[#e50913] focus:ring-2 focus:ring-[#e50913]/20",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
