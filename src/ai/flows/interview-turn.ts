
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InterviewTurnInputSchema = z.object({
  role: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionBank: z.string().optional(),
  transcript: z.array(z.object({
    role: z.enum(['user', 'ai']),
    content: z.string()
  })),
  userResponse: z.string()
});

export type InterviewTurnInput = z.infer<typeof InterviewTurnInputSchema>;

const InterviewTurnOutputSchema = z.object({
  feedback: z.string().describe('Minimal internal feedback or empty string.'),
  suggestions: z.string().describe('Minimal internal suggestions or empty string.'),
  score: z.number().describe('Internal score estimate 0-100.'),
  nextQuestion: z.string().describe('The next interview question.'),
  isComplete: z.boolean().describe('Whether the 20-question protocol is done.')
});

export type InterviewTurnOutput = z.infer<typeof InterviewTurnOutputSchema>;

const prompt = ai.definePrompt({
  name: 'interviewTurnPrompt',
  input: { schema: InterviewTurnInputSchema },
  output: { schema: InterviewTurnOutputSchema },
  prompt: `You are an expert AI Interviewer and Coach for the role of {{{role}}}.
  
  CURRENT STATE:
  - Role: {{{role}}}
  - Difficulty: {{{difficulty}}}
  
  CONTEXT:
  Here is the conversation so far:
  {{#each transcript}}
  - {{role}}: {{content}}
  {{/each}}
  
  LATEST USER RESPONSE:
  "{{{userResponse}}}"

  YOUR TASKS:
  1. Internal Review: Briefly note if the answer was correct internally (keep feedback/suggestions strings very short or empty to save tokens).
  2. GENERATE the next logical interview question. 
  
  {{#if questionBank}}
  A candidate question bank is available:
  {{{questionBank}}}
  Please select the most appropriate next question from this list if relevant, otherwise generate a follow-up.
  {{else}}
  If no question bank is provided, follow a technical/professional interview sequence.
  {{/if}}

  3. COMPLETION: This interview uses a 20-question protocol. Only set isComplete to true if the candidate has clearly finished their final answer (around turn 20).

  Format your response as purely valid JSON matching the output schema.`,
});

export async function interviewTurn(input: InterviewTurnInput): Promise<InterviewTurnOutput> {
  const { output } = await prompt(input);
  if (!output) throw new Error("AI failed to generate a response for this turn.");
  return output;
}

export const interviewTurnFlow = ai.defineFlow(
  {
    name: 'interviewTurnFlow',
    inputSchema: InterviewTurnInputSchema,
    outputSchema: InterviewTurnOutputSchema,
  },
  async input => {
    return await interviewTurn(input);
  }
);
