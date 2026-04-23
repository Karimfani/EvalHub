import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  useAdminListProjects,
  useApproveProject,
  useRejectProject,
  getAdminListProjectsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, FolderOpen, Star } from "lucide-react";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/15 text-green-400 border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function AdminProjectsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) setLocation("/");
  }, [user, authLoading]);

  const params = {
    page,
    limit: 20,
    status: statusFilter !== "all" ? statusFilter : undefined,
  };

  const { data, isLoading } = useAdminListProjects(params, {
    query: { enabled: !!user && user.role === "admin", queryKey: getAdminListProjectsQueryKey(params) },
  });

  const approveMutation = useApproveProject();
  const rejectMutation = useRejectProject();

  const handleApprove = (id: number) => {
    approveMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListProjectsQueryKey() });
          toast({ title: "Project approved" });
        },
        onError: () => toast({ title: "Error", description: "Failed to approve", variant: "destructive" }),
      },
    );
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListProjectsQueryKey() });
          toast({ title: "Project rejected" });
        },
        onError: () => toast({ title: "Error", description: "Failed to reject", variant: "destructive" }),
      },
    );
  };

  if (authLoading || !user || user.role !== "admin") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <FolderOpen className="w-6 h-6 text-primary" />
        <h1 className="font-display text-3xl text-foreground">Project Management</h1>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <Link href="/admin"><Button variant="ghost" size="sm">Overview</Button></Link>
        <Link href="/admin/projects"><Button variant="secondary" size="sm" data-testid="nav-admin-projects">Projects</Button></Link>
        <Link href="/admin/users"><Button variant="ghost" size="sm">Users</Button></Link>
        <Link href="/admin/payments"><Button variant="ghost" size="sm">Payments</Button></Link>
      </div>

      <div className="flex justify-end mb-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 bg-card border-card-border" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-card-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-muted-foreground font-mono text-xs">ID</th>
                  <th className="text-left p-3 text-muted-foreground font-mono text-xs">Title</th>
                  <th className="text-left p-3 text-muted-foreground font-mono text-xs hidden sm:table-cell">Category</th>
                  <th className="text-left p-3 text-muted-foreground font-mono text-xs hidden md:table-cell">Owner</th>
                  <th className="text-left p-3 text-muted-foreground font-mono text-xs">Status</th>
                  <th className="text-left p-3 text-muted-foreground font-mono text-xs hidden sm:table-cell">Votes</th>
                  <th className="text-left p-3 text-muted-foreground font-mono text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.projects?.map((project) => (
                  <tr key={project.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-project-${project.id}`}>
                    <td className="p-3 font-mono text-xs text-muted-foreground">#{project.id}</td>
                    <td className="p-3">
                      <Link href={`/projects/${project.id}`} className="text-foreground hover:text-primary transition-colors font-medium">
                        {project.title}
                      </Link>
                      {project.isFeatured && <Star className="inline w-3 h-3 ml-1 text-primary" />}
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className="text-xs font-mono text-muted-foreground">{project.category}</span>
                    </td>
                    <td className="p-3 hidden md:table-cell text-sm text-muted-foreground">{project.ownerName}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded border font-mono ${STATUS_COLORS[project.status] ?? ""}`} data-testid={`status-project-${project.id}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="p-3 hidden sm:table-cell font-mono text-xs text-muted-foreground">{project.voteCount}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {project.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            onClick={() => handleApprove(project.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`btn-approve-${project.id}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {project.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => handleReject(project.id)}
                            disabled={rejectMutation.isPending}
                            data-testid={`btn-reject-${project.id}`}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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
