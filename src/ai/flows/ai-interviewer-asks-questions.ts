
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
  isComplete: z.boolean().describe('Whether the interview is complete.')
});
export type AIInterviewerAsksQuestionsOutput = z.infer<typeof AIInterviewerAsksQuestionsOutputSchema>;

export async function aiInterviewerAsksQuestions(input: AIInterviewerAsksQuestionsInput): Promise<AIInterviewerAsksQuestionsOutput> {
  return aiInterviewerAsksQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiInterviewerAsksQuestionsPrompt',
  input: {schema: AIInterviewerAsksQuestionsInputSchema},
  output: {schema: AIInterviewerAsksQuestionsOutputSchema},
  prompt: `You are an AI interviewer. Your task is to ask a series of 5 questions.

You are interviewing a candidate for the role of {{{role}}}.

{{#if questionBank}}
You have been provided with the following question bank. Prioritize asking questions from this list.
---
{{{questionBank}}}
---
{{else}}
Here is the sequence of questions you must ask. Ask only one question at a time, in this order:
1.  "First, please introduce yourself."
2.  "Tell me about your most recent project experience."
3.  "What technologies and tools are you most comfortable with?"
4.  "What are your biggest strengths and weaknesses?"
5.  "Where do you see yourself in the next 5 years?"
{{/if}}


Based on the previous questions, determine which question to ask next.

{{#if previousQuestions}}
You have already asked the following questions:
{{#each previousQuestions}}
- {{{this}}}
{{/each}}
{{/if}}

Generate the next question from the list that has not been asked yet. If all 5 questions have been asked, respond with "The interview is now complete. Thank you for your time." and set isComplete to true. Otherwise, set isComplete to false.
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
