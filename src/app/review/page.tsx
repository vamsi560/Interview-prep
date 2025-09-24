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
import { ArrowUpDown, PlayCircle } from "lucide-react";
import Link from "next/link";

const interviews = [
  { id: 'int_001', role: 'Senior Software Engineer', date: '2024-07-20', duration: '25:10', score: 92 },
  { id: 'int_002', role: 'Product Manager', date: '2024-07-18', duration: '30:45', score: 88 },
  { id: 'int_003', role: 'UX/UI Designer', date: '2024-07-15', duration: '22:00', score: 95 },
  { id: 'int_004', role: 'Data Analyst', date: '2024-07-12', duration: '28:30', score: 85 },
  { id: 'int_005', role: 'Frontend Developer', date: '2024-07-10', duration: '20:15', score: 91 },
  { id: 'int_006', role: 'Backend Developer', date: '2024-07-08', duration: '35:00', score: 89 },
];

export default function ReviewPage() {
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
              All your recorded mock interviews are listed below.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                {interviews.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell className="font-medium">{interview.role}</TableCell>
                    <TableCell>{interview.date}</TableCell>
                    <TableCell>{interview.duration}</TableCell>
                    <TableCell className="text-right">{interview.score}%</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href="#">
                          <PlayCircle className="h-4 w-4" />
                           <span className="sr-only">Play recording</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
