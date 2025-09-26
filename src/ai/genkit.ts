import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({
    apiKey: 'AIzaSyAZKwC1d_krqu5d6B0j_7xxkxBAkYS0Jfw', // Replace with your actual Gemini API key
  })],
  model: 'googleai/gemini-2.5-flash',
});
