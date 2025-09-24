"use server";

import {
  aiInterviewerAsksQuestions,
  type AIInterviewerAsksQuestionsInput,
} from "@/ai/flows/ai-interviewer-asks-questions";
import {
  analyzeUserResponse,
  type AnalyzeUserResponseInput,
} from "@/ai/flows/ai-analyzes-user-responses";
import { z } from "zod";

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
