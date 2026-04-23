import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { useEffect } from "react";

const CATEGORIES = ["Technology", "Environment", "Healthcare", "Education", "Finance", "Other"];

const submitSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  category: z.string().min(1, "Please select a category"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type SubmitFormData = z.infer<typeof submitSchema>;

export default function SubmitProjectPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateProject();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading]);

  const form = useForm<SubmitFormData>({
    resolver: zodResolver(submitSchema),
    defaultValues: { title: "", description: "", category: "", imageUrl: "" },
  });

  const onSubmit = (data: SubmitFormData) => {
    createMutation.mutate(
      {
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          imageUrl: data.imageUrl || null,
        },
      },
      {
        onSuccess: (project) => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          toast({
            title: "Project submitted!",
            description: "Your project is under review. We'll notify you once it's approved.",
          });
          setLocation(`/projects/${project.id}`);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to submit project. Please try again.", variant: "destructive" });
        },
      },
    );
  };

  if (isLoading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <PlusCircle className="w-6 h-6 text-primary" />
          <h1 className="font-display text-3xl text-foreground">Submit a Project</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Share your idea with the community. Projects are reviewed before being published.
        </p>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="A compelling name for your project"
                      className="bg-background border-input"
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-input" data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your project, the problem it solves, and its impact..."
                      className="bg-background border-input min-h-32"
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Minimum 20 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      className="bg-background border-input"
                      data-testid="input-image-url"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">A URL to a cover image for your project</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
                data-testid="btn-submit-project"
              >
                {createMutation.isPending ? "Submitting..." : "Submit Project for Review"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
