import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminListPayments, getAdminListPaymentsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";
import { Link } from "wouter";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-4 h-4 text-green-400" />,
  pending: <Clock className="w-4 h-4 text-yellow-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
};

const STATUS_COLORS: Record<string, string> = {
  completed: "text-green-400",
  pending: "text-yellow-400",
  failed: "text-red-400",
};

export default function AdminPaymentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) setLocation("/");
  }, [user, authLoading]);

  const { data: payments, isLoading } = useAdminListPayments({
    query: { enabled: !!user && user.role === "admin", queryKey: getAdminListPaymentsQueryKey() },
  });

  if (authLoading || !user || user.role !== "admin") return null;

  const totalRevenue = payments?.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0) ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-6 h-6 text-primary" />
        <h1 className="font-display text-3xl text-foreground">Payment Management</h1>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <Link href="/admin"><Button variant="ghost" size="sm">Overview</Button></Link>
        <Link href="/admin/projects"><Button variant="ghost" size="sm">Projects</Button></Link>
        <Link href="/admin/users"><Button variant="ghost" size="sm">Users</Button></Link>
        <Link href="/admin/payments"><Button variant="secondary" size="sm" data-testid="nav-admin-payments">Payments</Button></Link>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-4 mb-6 flex items-center gap-4" data-testid="total-revenue-card">
        <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <p className="font-display text-2xl text-foreground">${(totalRevenue / 100).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground font-mono">Total Revenue (Completed)</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : (
        <div className="rounded-lg border border-card-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-muted-foreground font-mono text-xs">ID</th>
                <th className="text-left p-3 text-muted-foreground font-mono text-xs">User</th>
                <th className="text-left p-3 text-muted-foreground font-mono text-xs hidden sm:table-cell">Project</th>
                <th className="text-left p-3 text-muted-foreground font-mono text-xs">Amount</th>
                <th className="text-left p-3 text-muted-foreground font-mono text-xs">Status</th>
                <th className="text-left p-3 text-muted-foreground font-mono text-xs hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments?.map((payment) => (
                <tr key={payment.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-payment-${payment.id}`}>
                  <td className="p-3 font-mono text-xs text-muted-foreground">#{payment.id}</td>
                  <td className="p-3 text-xs text-muted-foreground font-mono">{payment.userEmail ?? `User #${payment.userId}`}</td>
                  <td className="p-3 hidden sm:table-cell text-sm text-foreground">{payment.projectTitle ?? `Project #${payment.projectId}`}</td>
                  <td className="p-3 font-mono text-sm font-semibold text-foreground">${(payment.amount / 100).toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`flex items-center gap-1.5 text-xs font-mono ${STATUS_COLORS[payment.status] ?? ""}`} data-testid={`status-payment-${payment.id}`}>
                      {STATUS_ICONS[payment.status]}
                      {payment.status}
                    </span>
                  </td>
                  <td className="p-3 hidden md:table-cell text-xs text-muted-foreground font-mono">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!payments || payments.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground font-mono text-sm">No payments yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
