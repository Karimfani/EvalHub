import { useParams, useLocation } from "wouter";
import { useEffect } from "react";
import {
  useGetProject,
  useGetMyVote,
  useVoteProject,
  useCreateCheckoutSession,
  getGetProjectQueryKey,
  getGetMyVoteQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ThumbsUp, Star, Calendar, User, Tag, ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const CATEGORY_COLORS: Record<string, string> = {
  Technology: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Environment: "bg-green-500/15 text-green-400 border-green-500/30",
  Healthcare: "bg-red-500/15 text-red-400 border-red-500/30",
  Education: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Finance: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  default: "bg-muted text-muted-foreground border-border",
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id, 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

  const { data: project, isLoading } = useGetProject(id, {
    query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) },
  });

  const { data: myVote } = useGetMyVote(id, {
    query: { enabled: !!id && !!user, queryKey: getGetMyVoteQueryKey(id) },
  });

  const voteMutation = useVoteProject();
  const checkoutMutation = useCreateCheckoutSession();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.split("?")[1] ?? "");
    if (searchParams.get("payment") === "success") {
      toast({ title: "Payment successful!", description: "Your project is now featured." });
    }
  }, []);

  const handleVote = () => {
    if (!user) {
      toast({ title: "Please log in", description: "You must be logged in to vote.", variant: "destructive" });
      return;
    }
    voteMutation.mutate(
      { id },
      {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getGetMyVoteQueryKey(id) });
          toast({
            title: result.voted ? "Vote added" : "Vote removed",
            description: `Total votes: ${result.voteCount}`,
          });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to vote. Try again.", variant: "destructive" });
        },
      },
    );
  };

  const handleFeature = () => {
    if (!user) {
      toast({ title: "Please log in", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    checkoutMutation.mutate(
      { data: { projectId: id } },
      {
        onSuccess: (data) => {
          if (data.url) {
            window.location.href = data.url;
          }
        },
        onError: () => {
          toast({ title: "Payment error", description: "Could not initiate checkout. Stripe may not be configured.", variant: "destructive" });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground font-mono">Project not found.</p>
        <Link href="/">
          <Button variant="outline" className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[project.category] ?? CATEGORY_COLORS.default;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/">
        <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground" data-testid="btn-back">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Projects
        </Button>
      </Link>

      {project.imageUrl && (
        <div className="rounded-lg overflow-hidden mb-6 border border-card-border aspect-video max-h-72">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover"
            data-testid="img-project-detail"
          />
        </div>
      )}

      <div className="flex flex-wrap items-start gap-3 mb-4">
        <span className={`text-xs px-2 py-1 rounded border font-mono ${categoryColor}`} data-testid="badge-category">
          <Tag className="w-3 h-3 inline mr-1" />
          {project.category}
        </span>
        {project.isFeatured && (
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/40 font-mono" data-testid="badge-featured">
            <Star className="w-3 h-3" />
            Featured
          </span>
        )}
        {project.status === "approved" ? (
          <span className="text-xs px-2 py-1 rounded bg-green-500/15 text-green-400 border border-green-500/30 font-mono">Approved</span>
        ) : project.status === "pending" ? (
          <span className="text-xs px-2 py-1 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 font-mono">Pending Review</span>
        ) : (
          <span className="text-xs px-2 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-mono">Rejected</span>
        )}
      </div>

      <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-4" data-testid="text-project-title">
        {project.title}
      </h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-mono mb-6 pb-6 border-b border-border">
        <span className="flex items-center gap-1" data-testid="text-owner">
          <User className="w-4 h-4" />
          {project.ownerName}
        </span>
        <span className="flex items-center gap-1" data-testid="text-date">
          <Calendar className="w-4 h-4" />
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
        <span className="flex items-center gap-1" data-testid="text-vote-count">
          <ThumbsUp className="w-4 h-4 text-primary" />
          {project.voteCount} votes
        </span>
      </div>

      <div className="prose prose-invert max-w-none mb-8">
        <p className="text-foreground/80 text-base leading-relaxed whitespace-pre-line" data-testid="text-description">
          {project.description}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleVote}
          disabled={voteMutation.isPending}
          variant={myVote?.voted ? "secondary" : "outline"}
          className="flex items-center gap-2"
          data-testid="btn-vote"
        >
          <ThumbsUp className="w-4 h-4" />
          {myVote?.voted ? "Remove Vote" : "Vote for This"}
          <span className="font-mono text-xs opacity-70">({project.voteCount})</span>
        </Button>

        {!project.isFeatured && user && (
          <Button
            onClick={handleFeature}
            disabled={checkoutMutation.isPending}
            variant="default"
            className="flex items-center gap-2 glow-blue"
            data-testid="btn-feature"
          >
            <Star className="w-4 h-4" />
            {checkoutMutation.isPending ? "Loading..." : "Feature This Project — $9.99"}
            <ExternalLink className="w-3 h-3 opacity-70" />
          </Button>
        )}
      </div>
    </div>
  );
}
