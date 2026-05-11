import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/super-admin/PageHeader";
import { UserPlus, Phone } from "lucide-react";
import { cashiers } from "@/lib/water-mock";

export const Route = createFileRoute("/water-admin/cashiers")({
  head: () => ({ meta: [{ title: "Cashiers — Water Retail" }] }),
  component: CashiersPage,
});

const fmt = (n: number) => "KES " + n.toLocaleString();
const initials = (n: string) => n.split(" ").map((s) => s[0]).slice(0, 2).join("");

function CashiersPage() {
  return (
    <div>
      <PageHeader
        title="Cashiers"
        subtitle="Manage cashier accounts and shifts at this branch."
        actions={<Button><UserPlus className="h-4 w-4 mr-1" /> Add cashier</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cashiers.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">{initials(c.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" /> {c.phone}
                  </div>
                </div>
                <Badge variant={c.status === "on_shift" ? "default" : "secondary"}>
                  {c.status === "on_shift" ? "On shift" : "Off"}
                </Badge>
              </div>

              <div className="text-xs text-muted-foreground mb-3">Shift {c.shift}</div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">Sales today</div>
                  <div className="font-display text-lg">{fmt(c.todaySales)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Transactions</div>
                  <div className="font-display text-lg">{c.txns}</div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">View activity</Button>
                <Button variant="outline" size="sm" className="flex-1">Edit</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
