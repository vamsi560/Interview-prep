import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({
    apiKey: 'AIzaSyBtRrzhUGm_3uIM98P3JRUEpiHYXcoMkfk', // Replace with your actual Gemini API key
  })],
  model: 'googleai/gemini-2.5-flash',
});
