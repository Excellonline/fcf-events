"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatPhoneNumber } from "@/lib/utils";

type PhoneInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode">;

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ defaultValue, onChange, placeholder = "(555) 555-5555", ...props }, ref) => {
    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      event.currentTarget.value = formatPhoneNumber(event.currentTarget.value);
      onChange?.(event);
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete={props.autoComplete ?? "tel"}
        placeholder={placeholder}
        defaultValue={typeof defaultValue === "string" ? formatPhoneNumber(defaultValue) : defaultValue}
        onChange={handleChange}
      />
    );
  },
);
PhoneInput.displayName = "PhoneInput";
