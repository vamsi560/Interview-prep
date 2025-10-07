
'use server';
/**
 * @fileOverview This file contains the AI proctoring flow for analyzing video frames during mock interviews.
 *
 * - proctoring - A function that takes a video frame and returns any detected violations.
 * - ProctoringInput - The input type for the proctoring function.
 * - ProctoringOutput - The return type for the proctoring function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProctoringInputSchema = z.object({
  videoFrameDataUri: z
    .string()
    .describe(
      "A single frame from the video feed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ProctoringInput = z.infer<typeof ProctoringInputSchema>;

const ProctoringOutputSchema = z.object({
    hasViolation: z.boolean().describe('Whether a violation was detected in the frame.'),
    violationType: z.enum(['none', 'looking_away', 'typing', 'phone_detected']).describe('The type of violation detected.'),
    warningMessage: z.string().describe('A user-friendly warning message if a violation is detected.'),
});
export type ProctoringOutput = z.infer<typeof ProctoringOutputSchema>;

export async function proctoring(input: ProctoringInput): Promise<ProctoringOutput> {
  return proctoringFlow(input);
}

const prompt = ai.definePrompt({
  name: 'proctoringPrompt',
  input: {schema: ProctoringInputSchema},
  output: {schema: ProctoringOutputSchema},
  prompt: `You are an AI proctor for a remote interview. You will be given a frame from the user's webcam feed.
  Your task is to analyze this frame for any of the following violations:
  - The user is looking away from the screen for an extended period.
  - The user is typing on their keyboard.
  - The user is looking at a phone or other device.

  If a violation is detected, set hasViolation to true, specify the violationType, and provide a brief, user-friendly warningMessage.
  If no violation is detected, set hasViolation to false and violationType to 'none'.

  Frame to analyze: {{media url=videoFrameDataUri}}`,
});

const proctoringFlow = ai.defineFlow(
  {
    name: 'proctoringFlow',
    inputSchema: ProctoringInputSchema,
    outputSchema: ProctoringOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
