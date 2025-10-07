
import type { GenerateSummaryReportOutput } from "@/ai/flows/generate-summary-report";

export type InterviewSettings = {
  role: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string | string[];
  questionBank?: string;
};

export type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

export type Feedback = {
  feedback: string;
  suggestions: string;
  score: number;
};

export type InterviewSession = {
  id: string;
  date: string;
  role: string;
  score: number;
  duration: string;
  feedback: Feedback[];
  transcript: Message[];
  summaryReport?: GenerateSummaryReportOutput | null;
};
