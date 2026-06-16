import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-white/10 bg-[#0b0b0b] px-3 text-sm text-white outline-none transition placeholder:text-[#666666] focus:border-[#e50913] focus:ring-2 focus:ring-[#e50913]/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

