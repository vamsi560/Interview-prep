import { config } from 'dotenv';
config();

import '@/ai/flows/ai-interviewer-asks-questions.ts';
import '@/ai/flows/incorporate-uploaded-question-bank.ts';
import '@/ai/flows/ai-analyzes-user-responses.ts';