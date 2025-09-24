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
  feedback: z.string().describe('Feedback on the user\s response, including areas for improvement.'),
  suggestions: z.string().describe('Specific suggestions for improving the user\s response.'),
});
export type AnalyzeUserResponseOutput = z.infer<typeof AnalyzeUserResponseOutputSchema>;

export async function analyzeUserResponse(input: AnalyzeUserResponseInput): Promise<AnalyzeUserResponseOutput> {
  return analyzeUserResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUserResponsePrompt',
  input: {schema: AnalyzeUserResponseInputSchema},
  output: {schema: AnalyzeUserResponseOutputSchema},
  prompt: `You are an AI-powered interview coach providing real-time feedback to users during mock interviews.

  Analyze the user's response to the interview question and provide feedback and suggestions for improvement.

  Interview Question: {{{interviewQuestion}}}
  User Response: {{{userResponse}}}
  Interview Context: {{{interviewContext}}}

  Format your response as follows:

  Feedback: [Your feedback on the user's response]
  Suggestions: [Specific suggestions for improving the user's response]`,
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
