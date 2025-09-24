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
import { Input } from "@/components/ui/input";
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

const formSchema = z.object({
  role: z.string().min(2, "Role must be at least 2 characters."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topics: z.string().optional(),
  questionBank: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function StartInterviewPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: "",
      difficulty: "medium",
      topics: "",
      questionBank: "",
    },
  });

  function onSubmit(values: FormValues) {
    const params = new URLSearchParams({
      role: values.role,
      difficulty: values.difficulty,
      ...(values.topics && { topics: values.topics }),
      ...(values.questionBank && { questionBank: values.questionBank }),
    });
    router.push(`/interview?${params.toString()}`);
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
                      <FormControl>
                        <Input placeholder="e.g., Software Engineer" {...field} />
                      </FormControl>
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
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Adjust the complexity of the questions.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="topics"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specific Topics (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., React, System Design" {...field} />
                      </FormControl>
                       <FormDescription>
                        Comma-separated list of topics to focus on.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <Button type="submit" className="w-full" size="lg">
                  Start Interview
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </AppShell>
  );
}
