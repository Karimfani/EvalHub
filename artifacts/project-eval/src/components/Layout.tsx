import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, PlusCircle, LayoutDashboard, Zap, User, CreditCard } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <Zap className="w-6 h-6 text-primary group-hover:text-secondary transition-colors" />
              <span className="font-display text-xl text-foreground tracking-wide">
                EvalHub
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/">
                <Button
                  variant={location === "/" ? "secondary" : "ghost"}
                  size="sm"
                  data-testid="nav-projects"
                >
                  Projects
                </Button>
              </Link>
              {user && (
                <>
                  <Link href="/submit">
                    <Button
                      variant={location === "/submit" ? "secondary" : "ghost"}
                      size="sm"
                      data-testid="nav-submit"
                    >
                      <PlusCircle className="w-4 h-4 mr-1" />
                      Submit
                    </Button>
                  </Link>
                  <Link href="/my-projects">
                    <Button
                      variant={location === "/my-projects" ? "secondary" : "ghost"}
                      size="sm"
                      data-testid="nav-my-projects"
                    >
                      My Projects
                    </Button>
                  </Link>
                  {user.role === "admin" && (
                    <Link href="/admin">
                      <Button
                        variant={location.startsWith("/admin") ? "secondary" : "ghost"}
                        size="sm"
                        data-testid="nav-admin"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-1" />
                        Admin
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{user.name}</span>
                    {user.role === "admin" && (
                      <Badge variant="secondary" className="text-xs">Admin</Badge>
                    )}
                  </div>
                  <Link href="/my-payments">
                    <Button variant="ghost" size="icon" data-testid="btn-payments">
                      <CreditCard className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    data-testid="btn-logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm" data-testid="btn-login">
                      <User className="w-4 h-4 mr-1" />
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" data-testid="btn-register">Register</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm font-mono">
          EvalHub &mdash; Where bold ideas fight for recognition
        </div>
      </footer>
    </div>
  );
}
