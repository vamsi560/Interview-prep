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
import Image from "next/image";
import organizationLogo from "@/assets/VMLogoWhite.png";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";
import { getMockCandidate } from "@/lib/mock-db";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [uniqueId, setUniqueId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Give a slight delay for better UX
    setTimeout(() => {
      const candidate = getMockCandidate(uniqueId);
      if (candidate) {
        toast({
          title: "Credential Accepted",
          description: "Proceeding to Aadhar verification...",
        });
        router.push(`/verify-aadhar?id=${uniqueId}`);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Unique ID",
          description: "Please check the interview link or ID provided to you.",
        });
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:flex flex-col items-start justify-center space-y-8 bg-gradient-to-br from-primary/30 to-secondary p-12 text-foreground">
        <div className="flex items-center gap-3">
          <Image src={organizationLogo} alt="Organization Logo" className="h-10 w-auto object-contain" />
          <h1 className="text-3xl font-bold">ProPrep AI - Recruitment Link</h1>
        </div>
        <h2 className="text-4xl font-bold tracking-tight">
          Welcome to your Interview Session
        </h2>
        <ul className="space-y-4 text-lg text-muted-foreground">
          <li className="flex items-start gap-3">
            <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <span>
              Enter the unique ID provided in your invitation email to begin.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <span>
              Ensure you have your Aadhar card ready for mandatory OCR verification on the next step.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <span>
              The session will be fully recorded as per organization guidelines.
            </span>
          </li>
        </ul>
      </div>
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center lg:hidden bg-slate-800 p-2 rounded-md">
                <Image src={organizationLogo} alt="Organization Logo" className="h-10 w-auto object-contain" />
            </div>
            <CardTitle className="text-2xl">Start Interview</CardTitle>
            <CardDescription>
              Please enter your unique Interview ID.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uniqueId">Unique ID</Label>
                <Input
                  id="uniqueId"
                  placeholder="e.g. cand-se-001"
                  value={uniqueId}
                  onChange={(e) => setUniqueId(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                  <p>Hint: Try using "cand-se-001" to bypass.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Verifying..." : "Enter Session"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
