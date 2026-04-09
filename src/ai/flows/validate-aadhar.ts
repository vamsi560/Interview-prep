"use server";

import { ai } from "@/ai/genkit";
import { z } from "zod";

const ValidateAadharInputSchema = z.object({
  imageUri: z.string().describe("The base64 encoded data URI of the captured Aadhar card image."),
});

const ValidateAadharOutputSchema = z.object({
  verified: z.boolean().describe("True if a 12-digit number resembling an Aadhar is found, false otherwise."),
  aadharNumber: z.string().optional().describe("The 12-digit number found, if any."),
  message: z.string().describe("Feedback message about the verification process."),
});

export type ValidateAadharInput = z.infer<typeof ValidateAadharInputSchema>;
export type ValidateAadharOutput = z.infer<typeof ValidateAadharOutputSchema>;

export const validateAadharFlow = ai.defineFlow(
  {
    name: "validateAadhar",
    inputSchema: ValidateAadharInputSchema,
    outputSchema: ValidateAadharOutputSchema,
  },
  async (input) => {
    try {
      const response = await ai.generate({
        prompt: [
          { text: "Perform OCR on this image. Look for any 12-digit number sequence (it could be formatted as XXXXXXXXXXXX or XXXX XXXX XXXX). If you find one, set verified to true, and return the number without spaces. If no 12-digit sequence is found, set verified to false." },
          { media: { url: input.imageUri } }
        ],
        output: { schema: ValidateAadharOutputSchema }
      });
      return response.output!;
    } catch (error) {
      console.error("OCR Error:", error);
      return { verified: false, message: "OCR processing failed or image was invalid." };
    }
  }
);
