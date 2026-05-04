
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FullInterviewAnalysisInputSchema = z.object({
  role: z.string(),
  transcript: z.array(z.object({
    role: z.enum(['user', 'ai']),
    content: z.string()
  }))
});

const FullInterviewAnalysisOutputSchema = z.object({
  overallScore: z.number(),
  summary: z.string().describe('A high-level executive summary of the performance.'),
  strengths: z.array(z.string()).describe('Top 3-5 strengths demonstrated.'),
  weaknesses: z.array(z.string()).describe('Areas for improvement.'),
  rubric: z.object({
    competencies: z.array(z.object({
      name: z.enum([
        'Problem Solving',
        'Technical Depth',
        'Communication',
        'Clarity & Structure',
        'Practicality',
        'Collaboration',
        'Ownership',
        'Behavioral Signals',
      ]),
      score: z.number().describe('0-100 for this competency.'),
      evidence: z.array(z.object({
        quote: z.string().describe('A short quote or paraphrase from the transcript (max ~1-2 sentences).'),
        speaker: z.enum(['user', 'ai']).describe('Who said the quoted line.'),
        whyItMatters: z.string().describe('Why this quote supports the competency score.'),
      })).describe('2-4 evidence items per competency.'),
    })).describe('Competency-based rubric scoring with evidence.'),
    overallNotes: z.string().describe('Short rubric notes for reviewers (1-2 paragraphs).'),
  }),
  technicalFeedback: z.string().describe('Detailed assessment of technical knowledge.'),
  behavioralFeedback: z.string().describe('Assessment of soft skills and communication.'),
  questionFeedback: z.array(z.object({
    question: z.string(),
    feedback: z.string(),
    score: z.number(),
    evidence: z.array(z.object({
      quote: z.string().describe('A short quote or paraphrase from the transcript supporting this score.'),
      speaker: z.enum(['user', 'ai']),
    })).describe('1-2 evidence snippets for this question.'),
  })).describe('Specific feedback for each individual question asked.'),
  hiringRecommendation: z.enum(['Strong Hire', 'Hire', 'Leaning Hire', 'No Hire']).describe('Final hiring recommendation.')
});

export type FullInterviewAnalysisInput = z.infer<typeof FullInterviewAnalysisInputSchema>;
export type FullInterviewAnalysisOutput = z.infer<typeof FullInterviewAnalysisOutputSchema>;

const analysisPrompt = ai.definePrompt({
  name: 'fullInterviewAnalysisPrompt',
  input: { schema: FullInterviewAnalysisInputSchema },
  output: { schema: FullInterviewAnalysisOutputSchema },
  prompt: `You are a Senior Principal Interviewer conducting a post-interview debrief for the role of {{{role}}}.
  
  You have just finished a 20-question interview. Below is the full transcript of the conversation:
  
  TRANSCRIPT:
  {{#each transcript}}
  - {{role}}: {{content}}
  {{/each}}
  
  YOUR TASK:
  Perform a deep-dive analysis of the candidate's performance.
  1. Evaluate technical depth based on their answers.
  2. Assess communication clarity and professionalism.
  3. Identify specific patterns in their strengths and gaps.
  4. provide specific feedback and a score (0-100) for EACH question in the transcript.
  5. Provide a final overall score (0-100) and a clear hiring recommendation.
  6. Provide a competency-based rubric with scores (0-100) and concrete evidence quotes/paraphrases from the transcript.

  Format your final report as purely valid JSON matching the output schema.`,
});

export async function analyzeFullInterview(input: FullInterviewAnalysisInput): Promise<FullInterviewAnalysisOutput> {
  const { output } = await analysisPrompt(input);
  if (!output) throw new Error("AI failed to generate a final analysis.");
  return output;
}
