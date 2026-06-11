import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/super-admin/PageHeader";
import {
  TrendingUp, Receipt, Users as UsersIcon, AlertCircle,
  Droplets, Truck, Plus,
} from "lucide-react";
import { businesses as mockBusinesses, recentActivity as mockActivity, pendingApprovals, activeUsers } from "@/lib/mock-data";
import { fetchBusinesses, fetchRecentActivity } from "@/lib/platform-data";
import { useLive } from "@/lib/use-live";

export const Route = createFileRoute("/super-admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Super Admin" }] }),
  component: Dashboard,
});

const fmt = (n: number) => "KES " + n.toLocaleString();

function Dashboard() {
  const businesses = useLive(["platform","businesses"], fetchBusinesses, mockBusinesses);
  const recentActivity = useLive(["platform","activity"], fetchRecentActivity, mockActivity);
  const totalRevenue = businesses.reduce((a, b) => a + b.today, 0);
  const totalTxns = businesses.reduce((a, b) => a + b.txns, 0);

  return (
    <div>
      <PageHeader
        title="Good morning, Super Admin"
        subtitle="Today across every vendor on the platform, in real time."
        actions={
          <>
            <Button variant="outline"><Plus className="h-4 w-4 mr-1" /> New shop</Button>
            <Button><Plus className="h-4 w-4 mr-1" /> New user</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Stat icon={TrendingUp} label="Revenue today" value={fmt(totalRevenue)} hint="All vendors" />
        <Stat icon={Receipt} label="Transactions" value={String(totalTxns)} hint="Across all arms" />
        <Stat icon={UsersIcon} label="Active now" value={String(activeUsers)} hint="Users online" />
        <Stat icon={AlertCircle} label="Pending approvals" value={String(pendingApprovals)} hint="Stock & refunds" highlight />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-8">
        <BusinessTile to="/super-admin/analytics" icon={Droplets} name="Water Retail"
          revenue={businesses[0].today} sub="Vendor-wide retail sales today" />
        <BusinessTile to="/super-admin/analytics" icon={Truck} name="Water Delivery"
          revenue={businesses[1].today} sub="Lorries in transit · litres delivered" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
            <Badge variant="outline">Live</Badge>
          </CardHeader>
          <CardContent className="divide-y">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-4 py-3 text-sm">
                <span className="text-muted-foreground tabular-nums w-12">{a.time}</span>
                <Badge variant="secondary" className="w-40 justify-start truncate">{a.business}</Badge>
                <span className="text-foreground/90 flex-1">{a.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Link to="/super-admin/shops" className="block"><Button variant="outline" className="w-full justify-start">Add new shop branch</Button></Link>
            <Link to="/super-admin/users" className="block"><Button variant="outline" className="w-full justify-start">Create user account</Button></Link>
            <Link to="/super-admin/expenses" className="block"><Button variant="outline" className="w-full justify-start">Review pending expenses</Button></Link>
            <Link to="/super-admin/payments" className="block"><Button variant="outline" className="w-full justify-start">Payment configuration</Button></Link>
            <Link to="/super-admin/reports" className="block"><Button className="w-full justify-start">Generate today's report</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint, highlight }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; hint: string; highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-accent" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{label}</div>
          <Icon className={`h-4 w-4 ${highlight ? "text-accent" : "text-muted-foreground"}`} />
        </div>
        <div className="font-display text-3xl mt-2">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{hint}</div>
      </CardContent>
    </Card>
  );
}

function BusinessTile({ to, icon: Icon, name, revenue, sub }: {
  to: string; icon: React.ComponentType<{ className?: string }>; name: string; revenue: number; sub: string;
}) {
  return (
    <Link to={to}>
      <Card className="group hover:border-primary transition-colors h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-primary">View →</span>
          </div>
          <div className="font-display text-xl mb-1">{name}</div>
          <div className="text-2xl font-medium tabular-nums">{fmt(revenue)}</div>
          <div className="text-xs text-muted-foreground mt-2">{sub}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
