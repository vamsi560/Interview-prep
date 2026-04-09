export const MockCandidates = [
  {
    id: "cand-se-001",
    role: "Software Engineer",
    difficulty: "medium",
    topics: ["React", "System Design", "Next.js"],
  },
  {
    id: "cand-de-002",
    role: "Data Engineer",
    difficulty: "hard",
    topics: ["Python", "SQL", "Spark"],
  },
  {
    id: "cand-ge-003",
    role: "Gen AI Engineer",
    difficulty: "easy",
    topics: ["LLMs", "Prompt Engineering"],
  }
];

export function getMockCandidate(id: string) {
  return MockCandidates.find(c => c.id === id) || null;
}

import type { InterviewSession } from "@/lib/types";

// Runtime mock DB for active app session
export const MockSessions: InterviewSession[] = [];

