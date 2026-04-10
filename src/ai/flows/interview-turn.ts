
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
  feedback: z.string().describe('Detailed feedback on the user\'s last answer.'),
  suggestions: z.string().describe('Tips for improvement.'),
  score: z.number().describe('Score from 0-100 for the last answer.'),
  nextQuestion: z.string().describe('The next interview question.'),
  isComplete: z.boolean().describe('Whether the interview cycle is done.')
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
  1. ANALYZE the latest user response based on the previous question asked. Provide constructive feedback, suggestions for improvement (like the STAR method), and a score (0-100).
  2. GENERATE the next logical interview question. 
  
  {{#if questionBank}}
  A candidate question bank is available:
  {{{questionBank}}}
  Please select the most appropriate next question from this list if relevant, otherwise generate a follow-up.
  {{else}}
  If no question bank is provided, follow a standard technical interview flow: 
  1. Intro (done if in transcript)
  2. Technical Project Deep Dive
  3. Technology Proficiency
  4. Strengths/Weaknesses
  5. Career Goals
  {{/if}}

  3. COMPLETION: If this was the 5th user response, set isComplete to true and provide a closing message. Otherwise set to false.

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
