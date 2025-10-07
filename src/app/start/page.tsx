
"use client";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { MultiSelect } from "@/components/ui/multi-select";
import { createInterviewSession } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const rolesAndTopics = {
  "Software Engineer": ["React", "System Design", "Algorithms", "Databases", "Next.js", "State Management", "Component Lifecycle"],
  "Java Developer": ["Core Java", "Spring Boot", "Hibernate", "Microservices", "JPA"],
  ".NET Developer": ["C#", "ASP.NET Core", "Entity Framework", "Azure", "MVC"],
  "Python Developer": ["Django", "Flask", "Data Structures", "APIs", "Pandas"],
  "Gen AI Engineer": ["LLMs", "Prompt Engineering", "Genkit", "Vector Databases", "Fine-tuning"],
  "Cloud Engineer": ["AWS", "Azure", "GCP", "Kubernetes", "Terraform"],
  "DevOps Engineer": ["CI/CD", "Docker", "Jenkins", "Ansible", "Monitoring"],
  "Product Manager": ["Product Strategy", "User Research", "Roadmapping", "Agile Methodologies"],
  "Data Scientist": ["Machine Learning", "Statistics", "Python", "Data Visualization"],
  "UX/UI Designer": ["User Research", "Wireframing", "Prototyping", "Visual Design"],
};

type Role = keyof typeof rolesAndTopics;

const formSchema = z.object({
  role: z.string().min(1, "Please select a job role."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topics: z.array(z.string()).optional(),
  questionBank: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function StartInterviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isStarting, setIsStarting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "",
      difficulty: "medium",
      topics: [],
      questionBank: "",
    },
  });

  const selectedRole = form.watch("role") as Role;
  const availableTopics = selectedRole ? rolesAndTopics[selectedRole] : [];

  React.useEffect(() => {
    form.setValue("topics", []);
  }, [selectedRole, form]);

  async function onSubmit(values: FormValues) {
    setIsStarting(true);
    
    const initialSession = {
      role: values.role,
      score: 0,
      duration: "0",
    };

    const result = await createInterviewSession(initialSession);

    if (result.success && result.id) {
      const params = new URLSearchParams({
        role: values.role,
        difficulty: values.difficulty,
        interviewId: result.id,
        ...(values.topics && values.topics.length > 0 && { topics: values.topics.join(',') }),
        ...(values.questionBank && { questionBank: values.questionBank }),
      });
      router.push(`/interview?${params.toString()}`);
    } else {
      toast({
        title: "Error starting interview",
        description: "Could not create an interview session. Please try again.",
        variant: "destructive",
      });
      setIsStarting(false);
    }
  }

  return (
    <AppShell>
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Start a New Interview</CardTitle>
            <CardDescription>
              Customize your mock interview session to fit your needs.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Role</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isStarting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a job role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.keys(rolesAndTopics).map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The position you're practicing for.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isStarting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy-Junior</SelectItem>
                          <SelectItem value="medium">Senior</SelectItem>
                          <SelectItem value="hard">Advanced-Lead</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Adjust the complexity of the questions.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedRole && (
                  <FormField
                    control={form.control}
                    name="topics"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specific Topics (Optional)</FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={availableTopics}
                            selected={field.value || []}
                            onChange={field.onChange}
                            placeholder="Select topics..."
                            disabled={isStarting}
                          />
                        </FormControl>
                        <FormDescription>
                          Choose specific topics to focus on.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="questionBank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Bank (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste your custom questions here, one per line."
                          className="min-h-32"
                          {...field}
                          disabled={isStarting}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide your own questions for the AI to use.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" size="lg" disabled={isStarting}>
                  {isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isStarting ? "Starting..." : "Start Interview"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </AppShell>
  );
}
