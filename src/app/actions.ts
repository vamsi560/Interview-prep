
"use server";

import {
  aiInterviewerAsksQuestions,
  type AIInterviewerAsksQuestionsInput,
} from "@/ai/flows/ai-interviewer-asks-questions";
import {
  analyzeUserResponse,
  type AnalyzeUserResponseInput,
} from "@/ai/flows/ai-analyzes-user-responses";
import { 
  proctoring, 
  type ProctoringInput 
} from "@/ai/flows/proctoring-flow";
import { 
  generateSummaryReport,
  type GenerateSummaryReportInput,
} from "@/ai/flows/generate-summary-report";

import { z } from "zod";
import { addInterviewSession, getInterviewSession, getInterviewSessions, updateInterviewSession } from "@/lib/firestore";
import type { InterviewSession } from "@/lib/types";

const getAIQuestionInputSchema = z.object({
  role: z.string(),
  difficultyLevel: z.enum(["easy", "medium", "hard"]),
  questionBank: z.string().optional(),
  previousQuestions: z.array(z.string()).optional(),
});

export async function getAIQuestion(input: AIInterviewerAsksQuestionsInput) {
  try {
    const parsedInput = getAIQuestionInputSchema.parse(input);
    const result = await aiInterviewerAsksQuestions(parsedInput);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in getAIQuestion:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

const getAIFeedbackInputSchema = z.object({
  userResponse: z.string(),
  interviewQuestion: z.string(),
  interviewContext: z.string().optional(),
});

export async function getAIFeedback(input: AnalyzeUserResponseInput) {
  try {
    const parsedInput = getAIFeedbackInputSchema.parse(input);
    const result = await analyzeUserResponse(parsedInput);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in getAIFeedback:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function createInterviewSession(session: Omit<InterviewSession, 'id' | 'date' | 'feedback' | 'transcript' | 'summaryReport'>) {
    return await addInterviewSession(session);
}

export async function saveInterviewSession(id: string, session: Omit<InterviewSession, 'id' | 'date' | 'role' | 'summaryReport'>) {
    return await updateInterviewSession(id, session);
}

export async function fetchInterviewSessions() {
    return await getInterviewSessions();
}

export async function fetchInterviewSession(id: string) {
    return await getInterviewSession(id);
}


const proctoringInputSchema = z.object({
  videoFrameDataUri: z.string(),
});

export async function checkProctoring(input: ProctoringInput) {
  try {
    const parsedInput = proctoringInputSchema.parse(input);
    const result = await proctoring(parsedInput);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in checkProctoring:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

export async function generateAndSaveSummaryReport(interviewId: string) {
  try {
    const session = await getInterviewSession(interviewId);
    if (!session) {
      throw new Error("Interview session not found.");
    }

    const reportInput: GenerateSummaryReportInput = {
      transcript: session.transcript.map(m => ({ role: m.role, content: m.content })),
      feedback: session.feedback,
      role: session.role,
    };

    const report = await generateSummaryReport(reportInput);

    await updateInterviewSession(interviewId, { summaryReport: report });

    return { success: true, data: report };
  } catch (error) {
    console.error("Error generating or saving summary report:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}
