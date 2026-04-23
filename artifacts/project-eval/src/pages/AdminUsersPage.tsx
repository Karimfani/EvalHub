import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAdminListUsers, getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function AdminUsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) setLocation("/");
  }, [user, authLoading]);

  const params = { page, limit: 20 };
  const { data, isLoading } = useAdminListUsers(params, {
    query: { enabled: !!user && user.role === "admin", queryKey: getAdminListUsersQueryKey(params) },
  });

  if (authLoading || !user || user.role !== "admin") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="font-display text-3xl text-foreground">User Management</h1>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <Link href="/admin"><Button variant="ghost" size="sm">Overview</Button></Link>
        <Link href="/admin/projects"><Button variant="ghost" size="sm">Projects</Button></Link>
        <Link href="/admin/users"><Button variant="secondary" size="sm" data-testid="nav-admin-users">Users</Button></Link>
        <Link href="/admin/payments"><Button variant="ghost" size="sm">Payments</Button></Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-card-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-muted-foreground font-mono text-xs">ID</th>
                  <th className="text-left p-3 text-muted-foreground font-mono text-xs">Name</th>
                  <th className="text-left p-3 text-muted-foreground font-mono text-xs">Email</th>
                  <th className="text-left p-3 text-muted-foreground font-mono text-xs">Role</th>
                  <th className="text-left p-3 text-muted-foreground font-mono text-xs hidden sm:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.users?.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-user-${u.id}`}>
                    <td className="p-3 font-mono text-xs text-muted-foreground">#{u.id}</td>
                    <td className="p-3 font-medium text-foreground">{u.name}</td>
                    <td className="p-3 text-muted-foreground font-mono text-xs">{u.email}</td>
                    <td className="p-3">
                      {u.role === "admin" ? (
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-role-${u.id}`}>Admin</Badge>
                      ) : (
                        <span className="text-xs font-mono text-muted-foreground" data-testid={`badge-role-${u.id}`}>User</span>
                      )}
                    </td>
                    <td className="p-3 hidden sm:table-cell text-xs text-muted-foreground font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} data-testid="btn-prev">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-mono text-muted-foreground">Page {page} of {data.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === data.totalPages} data-testid="btn-next">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
