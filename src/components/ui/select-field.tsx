import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
};

export function SelectField({
  className,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: Option[] }) {
  return (
    <select
      className={cn(
        "h-10 min-w-0 w-full rounded-md border border-white/10 bg-[#0b0b0b] px-3 text-sm text-white outline-none focus:border-[#e50913] focus:ring-2 focus:ring-[#e50913]/20",
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
