import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-[#999999]">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
        {detail ? <p className="mt-2 text-xs text-[#666666]">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

