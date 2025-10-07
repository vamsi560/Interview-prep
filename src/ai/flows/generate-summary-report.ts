
'use server';
/**
 * @fileOverview This file contains the AI flow for generating a post-interview summary report.
 *
 * - generateSummaryReport - A function that takes the entire interview transcript and feedback to generate a comprehensive report.
 * - GenerateSummaryReportInput - The input type for the generateSummaryReport function.
 * - GenerateSummaryReportOutput - The return type for the generateSummaryReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Message, Feedback } from '@/lib/types';

const GenerateSummaryReportInputSchema = z.object({
  transcript: z.array(z.object({
      role: z.enum(['user', 'ai']),
      content: z.string(),
  })).describe("The full transcript of the interview, including both AI questions and user responses."),
  feedback: z.array(z.object({
      feedback: z.string(),
      suggestions: z.string(),
      score: z.number(),
  })).describe("An array of all the feedback given to the user during the interview."),
  role: z.string().describe("The role the user was interviewing for."),
});
export type GenerateSummaryReportInput = z.infer<typeof GenerateSummaryReportInputSchema>;

const GenerateSummaryReportOutputSchema = z.object({
  overallScore: z.number().describe("The final calculated overall score for the entire interview, from 0 to 100."),
  strengths: z.string().describe("A summary of the user's key strengths, with examples from the interview."),
  areasForImprovement: z.string().describe("A summary of the key areas where the user can improve, with specific examples and actionable advice."),
  finalVerdict: z.string().describe("A concluding paragraph on the user's performance and their readiness for a real interview for this role."),
});
export type GenerateSummaryReportOutput = z.infer<typeof GenerateSummaryReportOutputSchema>;

export async function generateSummaryReport(input: GenerateSummaryReportInput): Promise<GenerateSummaryReportOutput> {
  return generateSummaryReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSummaryReportPrompt',
  input: {schema: GenerateSummaryReportInputSchema},
  output: {schema: GenerateSummaryReportOutputSchema},
  prompt: `You are an expert AI career coach, specializing in post-interview analysis.
  Your task is to provide a comprehensive summary report based on the provided interview transcript and feedback.
  The user was interviewing for the role of: {{{role}}}.

  First, calculate the overall score by averaging the scores from the individual feedback items.

  Then, analyze the full transcript and the collected feedback to create the report. The report must contain:
  1.  **Strengths:** Identify and summarize the user's key strengths. Quote or reference specific user responses from the transcript to support your points.
  2.  **Areas for Improvement:** Identify the most critical areas for improvement. Refer to specific examples from the interview and the AI's feedback to illustrate your points. Provide actionable advice for each area.
  3.  **Final Verdict:** Write a concluding paragraph that gives a holistic verdict on the user's performance and their potential readiness for a real interview.

  **Interview Transcript:**
  {{#each transcript}}
  - **{{role}}:** {{content}}
  {{/each}}

  **Feedback Received:**
  {{#each feedback}}
  - **Score: {{score}}**
    - Feedback: {{feedback}}
    - Suggestions: {{suggestions}}
  {{/each}}

  Generate the summary report based on this data.
  `,
});

const generateSummaryReportFlow = ai.defineFlow(
  {
    name: 'generateSummaryReportFlow',
    inputSchema: GenerateSummaryReportInputSchema,
    outputSchema: GenerateSummaryReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
