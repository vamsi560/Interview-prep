// Implemented by Gemini.
'use server';
/**
 * @fileOverview This file defines the AI interviewer flow that generates interview questions based on the specified role and difficulty level.
 *
 * - aiInterviewerAsksQuestions - A function that initiates the interview process by generating a question.
 * - AIInterviewerAsksQuestionsInput - The input type for the aiInterviewerAsksQuestions function.
 * - AIInterviewerAsksQuestionsOutput - The return type for the aiInterviewerAsksQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIInterviewerAsksQuestionsInputSchema = z.object({
  role: z.string().describe('The role for which the interview is being conducted.'),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the interview questions.'),
  questionBank: z.string().optional().describe('A string containing questions from the question bank excel sheet.'),
  previousQuestions: z.array(z.string()).optional().describe('List of questions already asked.')
});
export type AIInterviewerAsksQuestionsInput = z.infer<typeof AIInterviewerAsksQuestionsInputSchema>;

const AIInterviewerAsksQuestionsOutputSchema = z.object({
  question: z.string().describe('The generated interview question.'),
});
export type AIInterviewerAsksQuestionsOutput = z.infer<typeof AIInterviewerAsksQuestionsOutputSchema>;

export async function aiInterviewerAsksQuestions(input: AIInterviewerAsksQuestionsInput): Promise<AIInterviewerAsksQuestionsOutput> {
  return aiInterviewerAsksQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiInterviewerAsksQuestionsPrompt',
  input: {schema: AIInterviewerAsksQuestionsInputSchema},
  output: {schema: AIInterviewerAsksQuestionsOutputSchema},
  prompt: `You are an AI interviewer designed to ask relevant and challenging questions to candidates.

You are interviewing a candidate for the role of {{{role}}} at a difficulty level of {{{difficultyLevel}}}.

{% if questionBank %}Consider the following questions from the uploaded question bank: {{{questionBank}}}.{% endif %}

{% if previousQuestions.length > 0 %}Do not repeat these questions that were already asked: 
{{#each previousQuestions}}- {{{this}}}
{{/each}}{% endif %}

Generate one relevant interview question for the candidate. The question should be appropriate for the specified role and difficulty level.

Output the question in the following format:
{
  "question": "The generated question here"
}
`,
});

const aiInterviewerAsksQuestionsFlow = ai.defineFlow(
  {
    name: 'aiInterviewerAsksQuestionsFlow',
    inputSchema: AIInterviewerAsksQuestionsInputSchema,
    outputSchema: AIInterviewerAsksQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
