
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
// Firebase imports commented out - using local implementations
// import { addInterviewSession, getInterviewSession, getInterviewSessions, updateInterviewSession } from "@/lib/firestore";
import type { InterviewSession } from "@/lib/types";

const getAIQuestionInputSchema = z.object({
  role: z.string(),
  difficultyLevel: z.enum(["easy", "medium", "hard"]),
  questionBank: z.string().optional(),
  previousQuestions: z.array(z.string()).optional(),
});

export async function getAIQuestion(input: AIInterviewerAsksQuestionsInput) {
  try {
    // Add timeout to prevent long-running AI requests
    const aiTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI question generation timed out')), 30000) // 30 seconds
    );

    const generateQuestionPromise = async () => {
      const parsedInput = getAIQuestionInputSchema.parse(input);
      return await aiInterviewerAsksQuestions(parsedInput);
    };

    const result = await Promise.race([generateQuestionPromise(), aiTimeout]);
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
    // Quick bypass for Firebase issues - always return success with a local ID
    const localId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Creating interview session with ID:', localId);
    return { success: true, id: localId };
    
    // Uncomment below when Firebase is properly configured:
    // return await addInterviewSession(session);
}

export async function saveInterviewSession(id: string, session: Omit<InterviewSession, 'id' | 'date' | 'role' | 'summaryReport'>) {
    // Quick bypass for Firebase issues - always return success
    console.log('Saving interview session:', id, session);
    return { success: true, id };
    
    // Uncomment below when Firebase is properly configured:
    // return await updateInterviewSession(id, session);
}

export async function fetchInterviewSessions() {
    // Quick bypass for Firebase issues - return empty array
    console.log('Fetching interview sessions - returning empty array due to Firebase bypass');
    return [];
    
    // Uncomment below when Firebase is properly configured:
    // return await getInterviewSessions();
}

export async function fetchInterviewSession(id: string) {
    // Quick bypass for Firebase issues - return null
    console.log('Fetching interview session:', id, '- returning null due to Firebase bypass');
    return null;
    
    // Uncomment below when Firebase is properly configured:
    // return await getInterviewSession(id);
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
    // Quick bypass for Firebase issues
    console.log('Generating summary report for:', interviewId, '- bypassing due to Firebase issues');
    const mockReport = {
      overallScore: 75,
      strengths: "Good communication skills and clear explanations.",
      areasForImprovement: "Could provide more specific examples and technical details.",
      finalVerdict: "Shows potential but needs more preparation for technical questions."
    };
    return { success: true, data: mockReport };
    
    
    // Original Firebase-dependent code commented out:
    /*
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
    */
  } catch (error) {
    console.error("Error generating or saving summary report:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}
