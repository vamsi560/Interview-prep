"use client"

import { Mic } from "lucide-react";

export function UserResponseIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
      <Mic className="h-5 w-5 animate-pulse" />
      <span className="text-sm font-medium">Please talk...</span>
    </div>
  );
}
