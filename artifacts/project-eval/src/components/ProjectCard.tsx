import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Star, Calendar } from "lucide-react";

interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  isFeatured: boolean;
  imageUrl: string | null;
  voteCount: number;
  ownerName: string;
  createdAt: string;
}

interface ProjectCardProps {
  project: Project;
  showStatus?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Technology: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Environment: "bg-green-500/15 text-green-400 border-green-500/30",
  Healthcare: "bg-red-500/15 text-red-400 border-red-500/30",
  Education: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Finance: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  default: "bg-muted text-muted-foreground border-border",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/15 text-green-400 border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function ProjectCard({ project, showStatus = false }: ProjectCardProps) {
  const categoryColor = CATEGORY_COLORS[project.category] ?? CATEGORY_COLORS.default;
  const statusColor = STATUS_COLORS[project.status] ?? "";

  return (
    <Link href={`/projects/${project.id}`} data-testid={`card-project-${project.id}`}>
      <div
        className={`group rounded-lg border overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer h-full flex flex-col ${
          project.isFeatured
            ? "featured-gradient glow-blue"
            : "bg-card border-card-border hover:border-primary/40"
        }`}
      >
        {project.imageUrl && (
          <div className="aspect-video overflow-hidden relative">
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              data-testid={`img-project-${project.id}`}
            />
            {project.isFeatured && (
              <div className="absolute top-2 right-2">
                <span className="flex items-center gap-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-mono font-semibold">
                  <Star className="w-3 h-3" />
                  Featured
                </span>
              </div>
            )}
          </div>
        )}

        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span
              className={`text-xs px-2 py-0.5 rounded border font-mono ${categoryColor}`}
              data-testid={`badge-category-${project.id}`}
            >
              {project.category}
            </span>
            {showStatus && (
              <span
                className={`text-xs px-2 py-0.5 rounded border font-mono ${statusColor}`}
                data-testid={`badge-status-${project.id}`}
              >
                {project.status}
              </span>
            )}
          </div>

          <h3 className="font-display text-lg text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {project.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-3">
            {project.description}
          </p>

          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mt-auto pt-2 border-t border-border">
            <span data-testid={`text-owner-${project.id}`}>{project.ownerName}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1" data-testid={`text-votes-${project.id}`}>
                <ThumbsUp className="w-3 h-3 text-primary" />
                {project.voteCount}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
