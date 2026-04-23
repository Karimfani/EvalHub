import { useEffect } from "react";
import { useLocation } from "wouter";
import { useListMyPayments, getListMyPaymentsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  completed: { icon: <CheckCircle className="w-4 h-4" />, label: "Completed", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  pending: { icon: <Clock className="w-4 h-4" />, label: "Pending", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  failed: { icon: <XCircle className="w-4 h-4" />, label: "Failed", color: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export default function MyPaymentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading]);

  const { data: payments, isLoading } = useListMyPayments({
    query: { enabled: !!user, queryKey: getListMyPaymentsQueryKey() },
  });

  if (authLoading || !user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <CreditCard className="w-6 h-6 text-primary" />
        <div>
          <h1 className="font-display text-3xl text-foreground">Payment History</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Your project featuring payments</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : !payments || payments.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground font-mono">
          No payments yet. Feature a project to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const status = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG.pending;
            return (
              <div
                key={payment.id}
                className="bg-card border border-card-border rounded-lg p-4 flex items-center justify-between"
                data-testid={`payment-row-${payment.id}`}
              >
                <div className="flex items-center gap-4">
                  <CreditCard className="w-5 h-5 text-primary opacity-70" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {payment.projectTitle ?? `Project #${payment.projectId}`}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {new Date(payment.createdAt).toLocaleDateString()} &middot; ${(payment.amount / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
                <span
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border font-mono ${status.color}`}
                  data-testid={`status-payment-${payment.id}`}
                >
                  {status.icon}
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
