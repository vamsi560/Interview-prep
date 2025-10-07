
"use client";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchInterviewSessions } from "../actions";
import type { InterviewSession } from "@/lib/types";
import { format, parseISO } from "date-fns";

export default function ReviewPage() {
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInterviews() {
      setLoading(true);
      const fetchedInterviews = await fetchInterviewSessions();
      setInterviews(fetchedInterviews);
      setLoading(false);
    }
    loadInterviews();
  }, []);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Past Interviews</h1>
          <p className="text-muted-foreground">
            Review your previous sessions to track your progress.
          </p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Interview History</CardTitle>
            <CardDescription>
              All your recorded mock interviews will be listed below.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {loading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
             ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" size="sm">
                      Role
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" size="sm">
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">
                    <Button variant="ghost" size="sm">
                      Score
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interviews.length > 0 ? (
                  interviews.map((interview) => (
                    <TableRow key={interview.id}>
                      <TableCell className="font-medium">{interview.role}</TableCell>
                      <TableCell>{format(parseISO(interview.date), "PPP")}</TableCell>
                      <TableCell>{interview.duration}m</TableCell>
                      <TableCell className="text-right">{interview.score}%</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/review/${interview.id}`}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            View Report
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No interviews found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
             )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
