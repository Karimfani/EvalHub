import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useListProjects, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import ProjectCard from "@/components/ProjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusCircle, FolderOpen } from "lucide-react";

export default function MyProjectsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading]);

  const params = { page: 1, limit: 100 };
  const { data, isLoading } = useListProjects(params, {
    query: {
      enabled: !!user,
      queryKey: getListProjectsQueryKey(params),
    },
  });

  const myProjects = data?.projects?.filter((p) => (p as any).userId === user?.id) ?? [];

  if (authLoading || !user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-foreground mb-1">My Projects</h1>
          <p className="text-muted-foreground text-sm">Projects you've submitted to EvalHub</p>
        </div>
        <Link href="/submit">
          <Button data-testid="btn-submit-new">
            <PlusCircle className="w-4 h-4 mr-2" />
            Submit New
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-card-border bg-card p-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : myProjects.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground font-mono mb-4">You haven't submitted any projects yet.</p>
          <Link href="/submit">
            <Button data-testid="btn-first-project">Submit Your First Project</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myProjects.map((p) => (
            <ProjectCard key={p.id} project={p} showStatus />
          ))}
        </div>
      )}
    </div>
  );
}
