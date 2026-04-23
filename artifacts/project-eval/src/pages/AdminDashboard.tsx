import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAdminGetAnalytics, getAdminGetAnalyticsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Users, FolderOpen, ThumbsUp, DollarSign, Clock, CheckCircle, XCircle, Star, LayoutDashboard
} from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  testId: string;
}

function StatCard({ label, value, icon, color, testId }: StatCardProps) {
  return (
    <div className={`bg-card border border-card-border rounded-lg p-5 flex items-center gap-4`} data-testid={testId}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-display text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground font-mono">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, authLoading]);

  const { data: analytics, isLoading } = useAdminGetAnalytics({
    query: { enabled: !!user && user.role === "admin", queryKey: getAdminGetAnalyticsQueryKey() },
  });

  if (authLoading || !user || user.role !== "admin") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <LayoutDashboard className="w-6 h-6 text-primary" />
        <h1 className="font-display text-3xl text-foreground">Admin Dashboard</h1>
      </div>

      <div className="flex gap-3 mb-8 flex-wrap">
        <Link href="/admin">
          <Button variant="secondary" size="sm" data-testid="nav-admin-overview">Overview</Button>
        </Link>
        <Link href="/admin/projects">
          <Button variant="ghost" size="sm" data-testid="nav-admin-projects">Projects</Button>
        </Link>
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" data-testid="nav-admin-users">Users</Button>
        </Link>
        <Link href="/admin/payments">
          <Button variant="ghost" size="sm" data-testid="nav-admin-payments">Payments</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={analytics?.totalUsers ?? 0} icon={<Users className="w-5 h-5 text-blue-400" />} color="bg-blue-500/15" testId="stat-users" />
          <StatCard label="Total Projects" value={analytics?.totalProjects ?? 0} icon={<FolderOpen className="w-5 h-5 text-purple-400" />} color="bg-purple-500/15" testId="stat-projects" />
          <StatCard label="Total Votes" value={analytics?.totalVotes ?? 0} icon={<ThumbsUp className="w-5 h-5 text-green-400" />} color="bg-green-500/15" testId="stat-votes" />
          <StatCard label="Revenue" value={`$${((analytics?.totalRevenue ?? 0) / 100).toFixed(2)}`} icon={<DollarSign className="w-5 h-5 text-yellow-400" />} color="bg-yellow-500/15" testId="stat-revenue" />
          <StatCard label="Pending" value={analytics?.pendingProjects ?? 0} icon={<Clock className="w-5 h-5 text-yellow-400" />} color="bg-yellow-500/15" testId="stat-pending" />
          <StatCard label="Approved" value={analytics?.approvedProjects ?? 0} icon={<CheckCircle className="w-5 h-5 text-green-400" />} color="bg-green-500/15" testId="stat-approved" />
          <StatCard label="Rejected" value={analytics?.rejectedProjects ?? 0} icon={<XCircle className="w-5 h-5 text-red-400" />} color="bg-red-500/15" testId="stat-rejected" />
          <StatCard label="Featured" value={analytics?.featuredProjects ?? 0} icon={<Star className="w-5 h-5 text-primary" />} color="bg-primary/15" testId="stat-featured" />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/projects?status=pending" className="block">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 hover:border-yellow-500/60 transition-colors" data-testid="card-pending-projects">
            <Clock className="w-5 h-5 text-yellow-400 mb-2" />
            <p className="font-display text-lg text-foreground">Review Pending Projects</p>
            <p className="text-sm text-muted-foreground font-mono">{analytics?.pendingProjects ?? 0} awaiting approval</p>
          </div>
        </Link>
        <Link href="/admin/users" className="block">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 hover:border-blue-500/60 transition-colors" data-testid="card-manage-users">
            <Users className="w-5 h-5 text-blue-400 mb-2" />
            <p className="font-display text-lg text-foreground">Manage Users</p>
            <p className="text-sm text-muted-foreground font-mono">{analytics?.totalUsers ?? 0} registered</p>
          </div>
        </Link>
        <Link href="/admin/payments" className="block">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 hover:border-green-500/60 transition-colors" data-testid="card-view-payments">
            <DollarSign className="w-5 h-5 text-green-400 mb-2" />
            <p className="font-display text-lg text-foreground">View Payments</p>
            <p className="text-sm text-muted-foreground font-mono">${((analytics?.totalRevenue ?? 0) / 100).toFixed(2)} total</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
