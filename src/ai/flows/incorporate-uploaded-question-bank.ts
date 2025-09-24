'use server';
/**
 * @fileOverview This file defines a Genkit flow for incorporating uploaded question banks into mock interviews.
 *
 * The flow takes an Excel sheet (as a data URI) and user input (role, difficulty level, and specific topics),
 * then intelligently incorporates questions from the sheet into the mock interview.
 *
 * @interface IncorporateUploadedQuestionBankInput - The input type for the incorporateUploadedQuestionBank function.
 * @interface IncorporateUploadedQuestionBankOutput - The output type for the incorporateUploadedQuestionBank function.
 * @function incorporateUploadedQuestionBank - The main function to trigger the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IncorporateUploadedQuestionBankInputSchema = z.object({
  excelDataUri: z
    .string()
    .describe(
      'The Excel sheet containing custom questions, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Ensure proper documentation for data URI format
    ),
  role: z.string().describe('The role the user is interviewing for.'),
  difficultyLevel: z.string().describe('The difficulty level of the interview.'),
  specificTopics: z
    .string()
    .describe('Specific topics to cover during the interview.'),
});
export type IncorporateUploadedQuestionBankInput = z.infer<
  typeof IncorporateUploadedQuestionBankInputSchema
>;

const IncorporateUploadedQuestionBankOutputSchema = z.object({
  interviewPrompt: z
    .string()
    .describe(
      'A prompt for the AI interviewer that incorporates questions from the uploaded Excel sheet, tailored to the specified role, difficulty level, and topics.'
    ),
});
export type IncorporateUploadedQuestionBankOutput = z.infer<
  typeof IncorporateUploadedQuestionBankOutputSchema
>;

export async function incorporateUploadedQuestionBank(
  input: IncorporateUploadedQuestionBankInput
): Promise<IncorporateUploadedQuestionBankOutput> {
  return incorporateUploadedQuestionBankFlow(input);
}

const prompt = ai.definePrompt({
  name: 'incorporateUploadedQuestionBankPrompt',
  input: {schema: IncorporateUploadedQuestionBankInputSchema},
  output: {schema: IncorporateUploadedQuestionBankOutputSchema},
  prompt: `You are an AI interview question generator. You will receive an Excel sheet containing interview questions, the role the user is interviewing for, the difficulty level, and specific topics to cover.

  Your task is to create a prompt for the AI interviewer that incorporates questions from the Excel sheet, tailored to the specified role, difficulty level, and topics.  Use the questions in the excel sheet, but do not only use the questions in the excel sheet.  Act as if you are a real interviewer.

  Here is the Excel sheet data: {{media url=excelDataUri}}
  Role: {{role}}
  Difficulty Level: {{difficultyLevel}}
  Specific Topics: {{specificTopics}}`,
});

const incorporateUploadedQuestionBankFlow = ai.defineFlow(
  {
    name: 'incorporateUploadedQuestionBankFlow',
    inputSchema: IncorporateUploadedQuestionBankInputSchema,
    outputSchema: IncorporateUploadedQuestionBankOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
