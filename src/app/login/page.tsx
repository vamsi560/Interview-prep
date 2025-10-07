
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      if (email === "user@example.com" && password === "password") {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        router.push("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Credentials",
          description: "Please check your email and password.",
        });
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col items-start justify-center space-y-8 bg-gradient-to-br from-primary/10 to-secondary p-12 text-foreground">
        <div className="flex items-center gap-3">
          <Logo className="size-10 text-primary" />
          <h1 className="text-3xl font-bold">ProPrep AI</h1>
        </div>
        <h2 className="text-4xl font-bold tracking-tight">
          Unlock Your Career Potential with AI-Powered Interview Coaching
        </h2>
        <ul className="space-y-4 text-lg text-muted-foreground">
          <li className="flex items-start gap-3">
            <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <span>
              Practice with a realistic AI interviewer tailored to your target job.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <span>
              Get instant, constructive feedback on your responses to improve on the fly.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <span>
              Receive detailed post-interview reports to track your progress and identify weaknesses.
            </span>
          </li>
        </ul>
      </div>
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center lg:hidden">
                <Logo className="size-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                  <p>Use default credentials:</p>
                  <p>Email: user@example.com</p>
                  <p>Password: password</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
