
import { config } from 'dotenv';
config();

import '@/ai/flows/ai-interviewer-asks-questions.ts';
import '@/ai/flows/incorporate-uploaded-question-bank.ts';
import '@/ai/flows/ai-analyzes-user-responses.ts';
import '@/ai/flows/proctoring-flow.ts';
import '@/ai/flows/generate-summary-report.ts';
