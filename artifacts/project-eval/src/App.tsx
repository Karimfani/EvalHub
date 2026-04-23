import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import SubmitProjectPage from "@/pages/SubmitProjectPage";
import MyProjectsPage from "@/pages/MyProjectsPage";
import MyPaymentsPage from "@/pages/MyPaymentsPage";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminProjectsPage from "@/pages/AdminProjectsPage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import AdminPaymentsPage from "@/pages/AdminPaymentsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/projects/:id" component={ProjectDetailPage} />
        <Route path="/submit" component={SubmitProjectPage} />
        <Route path="/my-projects" component={MyProjectsPage} />
        <Route path="/my-payments" component={MyPaymentsPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/projects" component={AdminProjectsPage} />
        <Route path="/admin/users" component={AdminUsersPage} />
        <Route path="/admin/payments" component={AdminPaymentsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
