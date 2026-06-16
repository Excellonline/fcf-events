import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentCompletePage() {
  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <PublicHeader />
      <section className="mx-auto flex max-w-3xl flex-col px-4 py-16 md:px-8">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-[#e50913]" aria-hidden />
            <h1 className="mt-5 text-3xl font-semibold">Payment Received</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#dddddd]">
              Zeffy is confirming the payment with FCF Events. Your QR ticket will be issued automatically once that confirmation is received.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/account">View Tickets</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back to Events</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
      <PublicFooter />
    </main>
  );
}
