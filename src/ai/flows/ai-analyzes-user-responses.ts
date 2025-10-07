
'use server';
/**
 * @fileOverview This file contains the AI analysis flow for providing real-time feedback on user responses during mock interviews.
 *
 * - analyzeUserResponse - A function that takes the user's response and interview context as input and returns feedback and suggestions for improvement.
 * - AnalyzeUserResponseInput - The input type for the analyzeUserResponse function.
 * - AnalyzeUserResponseOutput - The return type for the analyzeUserResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUserResponseInputSchema = z.object({
  userResponse: z.string().describe('The user\s response to the interview question.'),
  interviewQuestion: z.string().describe('The current interview question.'),
  interviewContext: z.string().optional().describe('Additional context about the interview, such as the role being interviewed for.'),
});
export type AnalyzeUserResponseInput = z.infer<typeof AnalyzeUserResponseInputSchema>;

const AnalyzeUserResponseOutputSchema = z.object({
  feedback: z.string().describe('Detailed, constructive feedback on the user\s response. This should include what the user did well and where they can improve.'),
  suggestions: z.string().describe('Actionable suggestions for how the user can improve their answer. For behavioral questions, suggest how to use the STAR method (Situation, Task, Action, Result) if it was not used effectively.'),
  score: z.number().describe("A score from 0 to 100 for the user's response, based on clarity, relevance, and structure."),
});
export type AnalyzeUserResponseOutput = z.infer<typeof AnalyzeUserResponseOutputSchema>;

export async function analyzeUserResponse(input: AnalyzeUserResponseInput): Promise<AnalyzeUserResponseOutput> {
  return analyzeUserResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUserResponsePrompt',
  input: {schema: AnalyzeUserResponseInputSchema},
  output: {schema: AnalyzeUserResponseOutputSchema},
  prompt: `You are an expert AI interview coach. Your goal is to provide insightful, real-time feedback to help users ace their interviews.

  Analyze the user's response based on the following criteria:
  1.  **Relevance:** Was the answer directly related to the question?
  2.  **Clarity & Conciseness:** Was the answer easy to understand and to the point?
  3.  **Structure (for behavioral questions):** Did the user effectively use the STAR method (Situation, Task, Action, Result) to structure their response?
  4.  **Examples:** Were the examples provided relevant and impactful?

  **Interview Question:** {{{interviewQuestion}}}
  **User Response:** {{{userResponse}}}
  **Interview Context:** {{{interviewContext}}}

  Based on your analysis, provide:
  - **Feedback:** A detailed breakdown of what the user did well and what they could improve upon.
  - **Suggestions:** Specific, actionable tips. If the STAR method was missing or weak, explain how they could have used it better for this specific answer.
  - **Score:** A score from 0 to 100 reflecting the overall quality of the response.`,
});

const analyzeUserResponseFlow = ai.defineFlow(
  {
    name: 'analyzeUserResponseFlow',
    inputSchema: AnalyzeUserResponseInputSchema,
    outputSchema: AnalyzeUserResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
