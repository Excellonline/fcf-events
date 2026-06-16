import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DiscountsPage() {
  return (
    <>
      <PageHeader eyebrow="Access" title="Discounts" description="Codes for discounted, comped, access-only, and private ticket workflows." />
      <Card>
        <CardHeader>
          <CardTitle>Discount Rules</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[
            ["EARLYFCF", "15% off General Admission", "percentage"],
            ["VIPGUEST", "Access to hidden VIP allocation", "access-only"],
            ["SPEAKERCOMP", "Comped speaker ticket", "comp"],
            ["INVOICE25", "$25 manual invoice credit", "fixed amount"],
          ].map(([code, text, type]) => (
            <div key={code} className="rounded-md border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm font-semibold text-white">{code}</p>
                <Badge variant="muted">{type}</Badge>
              </div>
              <p className="mt-2 text-sm text-[#999999]">{text}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

