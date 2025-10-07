
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { fetchInterviewSession } from "@/app/actions";
import type { InterviewSession, Message } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Star, BarChart, Lightbulb, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";

function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-1/3 bg-muted rounded-md" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 bg-muted rounded-lg" />
        <div className="h-24 bg-muted rounded-lg" />
        <div className="h-24 bg-muted rounded-lg" />
      </div>
      <div className="space-y-4">
        <div className="h-6 w-1/4 bg-muted rounded-md" />
        <div className="h-20 w-full bg-muted rounded-lg" />
      </div>
      <div className="space-y-4">
        <div className="h-6 w-1/4 bg-muted rounded-md" />
        <div className="h-20 w-full bg-muted rounded-lg" />
      </div>
       <div className="space-y-4">
        <div className="h-6 w-1/4 bg-muted rounded-md" />
        <div className="h-20 w-full bg-muted rounded-lg" />
      </div>
    </div>
  );
}


export default function ReportPage() {
  const params = useParams();
  const id = params.id as string;
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const loadSession = async () => {
        setLoading(true);
        const fetchedSession = await fetchInterviewSession(id);
        if(fetchedSession) {
             setSession(fetchedSession);
        }
        setLoading(false);
      };
      loadSession();
    }
  }, [id]);

  const aiAvatar = PlaceHolderImages.find((img) => img.id === "ai-avatar");
  const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar");

  // Associate each user response with its corresponding feedback
  const userMessagesWithFeedback = session?.transcript
    .filter(m => m.role === 'user')
    .map((message, index) => ({
      ...message,
      feedback: session.feedback[index] || null
    }));

  // Create a map for quick lookup
  const feedbackMap = new Map(userMessagesWithFeedback?.map(m => [m.id, m.feedback]));

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header className="flex items-center gap-4">
           <Button variant="outline" size="icon" asChild>
            <Link href="/review">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Interview Report
            </h1>
            <p className="text-muted-foreground">
              A detailed summary of your performance.
            </p>
          </div>
        </header>

         <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Summary</CardTitle>
                 <CardDescription>
                    {session ? `${session.role} on ${format(parseISO(session.date), "PPP")}` : "Loading..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading || !session?.summaryReport ? (
                  <ReportSkeleton />
                ) : (
                  <div className="space-y-8">
                     <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                      <Card className="p-4 bg-secondary">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                          <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                          <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="text-2xl font-bold">{session.summaryReport.overallScore}%</div>
                        </CardContent>
                      </Card>
                      <Card className="p-4 bg-secondary">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                          <CardTitle className="text-sm font-medium">Duration</CardTitle>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="text-2xl font-bold">{session.duration}m</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h3 className="flex items-center font-semibold mb-2 text-lg"><TrendingUp className="mr-2 h-5 w-5 text-green-500" />Strengths</h3>
                      <p className="text-muted-foreground prose prose-sm max-w-none">
                        {session.summaryReport.strengths}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="flex items-center font-semibold mb-2 text-lg"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />Areas for Improvement</h3>
                      <p className="text-muted-foreground prose prose-sm max-w-none">
                        {session.summaryReport.areasForImprovement}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="flex items-center font-semibold mb-2 text-lg"><Star className="mr-2 h-5 w-5 text-primary" />Final Verdict</h3>
                      <p className="text-muted-foreground prose prose-sm max-w-none">
                        {session.summaryReport.finalVerdict}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Interview Transcript</CardTitle>
                <CardDescription>
                  The full conversation log.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <ScrollArea className="h-[60vh] pr-4">
                  {loading ? (
                    <div className="space-y-4">
                        <div className="h-16 w-full bg-muted rounded-lg" />
                        <div className="h-20 w-full bg-muted rounded-lg" />
                        <div className="h-16 w-full bg-muted rounded-lg" />
                    </div>
                  ) : session && session.transcript ? (
                    <div className="space-y-6">
                      {session.transcript.map((message: Message) => {
                        const feedback = message.role === 'user' ? feedbackMap.get(message.id) : null;
                        return (
                          <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                            {message.role === 'ai' && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={aiAvatar?.imageUrl} data-ai-hint={aiAvatar?.imageHint} />
                                <AvatarFallback>AI</AvatarFallback>
                              </Avatar>
                            )}
                            <div className={`max-w-xs rounded-lg p-3 text-sm ${message.role === 'ai' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                              <p>{message.content}</p>
                              {feedback && (
                                  <Badge variant="secondary" className="mt-2">Score: {feedback.score}%</Badge>
                              )}
                            </div>
                            {message.role === 'user' && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={userAvatar?.imageUrl} data-ai-hint={userAvatar?.imageHint} />
                                <AvatarFallback>U</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">
                      No transcript available.
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
