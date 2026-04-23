import { useState } from "react";
import { useListProjects, useGetProjectCategories, useGetTopVotedProjects, getListProjectsQueryKey } from "@workspace/api-client-react";
import ProjectCard from "@/components/ProjectCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, TrendingUp, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState<string>("");
  const [sort, setSort] = useState<"featured" | "votes" | "newest">("featured");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const params = {
    page,
    limit: 12,
    search: search || undefined,
    category: category || undefined,
    sort,
  };

  const { data, isLoading } = useListProjects(params, {
    query: { queryKey: getListProjectsQueryKey(params) },
  });

  const { data: categories } = useGetProjectCategories();
  const { data: topVoted } = useGetTopVotedProjects({ limit: 3 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey(params) });
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val === "all" ? "" : val);
    setPage(1);
  };

  const handleSortChange = (val: string) => {
    setSort(val as "featured" | "votes" | "newest");
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl sm:text-5xl text-foreground mb-3 tracking-wide">
          <span className="text-primary">Discover</span> Bold Ideas
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          The arena where innovative projects compete for community recognition. Vote for the ones that matter.
        </p>
      </div>

      {/* Top Voted Sidebar Items */}
      {topVoted && topVoted.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Top Voted</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topVoted.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 bg-card border border-card-border rounded-lg p-3 hover:border-primary/40 transition-colors"
                data-testid={`top-voted-${p.id}`}
              >
                <span className="font-display text-2xl text-primary/60">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.voteCount} votes</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search projects..."
            className="flex-1 bg-card border-card-border"
            data-testid="input-search"
          />
          <Button type="submit" variant="secondary" data-testid="btn-search">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        <Select value={category || "all"} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-40 bg-card border-card-border" data-testid="select-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.category} value={c.category}>
                {c.category} ({c.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-36 bg-card border-card-border" data-testid="select-sort">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Featured</span>
            </SelectItem>
            <SelectItem value="votes">Most Voted</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-card-border bg-card overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.projects?.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-mono">No projects found. Be the first to submit one.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {data?.projects?.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                data-testid="btn-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-mono text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                data-testid="btn-next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
