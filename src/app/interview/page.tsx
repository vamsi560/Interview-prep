import { AppShell } from "@/components/app-shell";
import { InterviewView } from "./interview-view";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function InterviewLoadingSkeleton() {
    return (
        <div className="flex flex-col h-full">
            <Skeleton className="h-16 w-1/3 mb-8" />
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                 <div className="flex items-start flex-row-reverse gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        </div>
    )
}


export default function InterviewPage() {
  return (
    <AppShell>
      <div className="h-[calc(100vh-10rem)]">
        <Suspense fallback={<InterviewLoadingSkeleton />}>
          <InterviewView />
        </Suspense>
      </div>
    </AppShell>
  );
}
