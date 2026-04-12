"use server";

import { verifyAadharWithADI } from "@/lib/azure-id-verify";
import { analyzeFrameWithAzure } from "@/lib/azure-vision-proctor";
import { z } from "zod";
import { MockSessions } from "@/lib/mock-db";
import { 
  generateSummaryReport,
  type GenerateSummaryReportInput,
} from "@/ai/flows/generate-summary-report";
import { interviewTurn } from "@/ai/flows/interview-turn";
import { FALLBACK_QUESTIONS } from "@/lib/interview-constants";

export async function processInterviewTurn(input: {
  role: string,
  difficulty: "easy" | "medium" | "hard",
  questionBank?: string,
  transcript: { role: 'user' | 'ai', content: string }[],
  userResponse: string
}) {
  try {
    const result = await withRetry(() => interviewTurn({
      role: input.role,
      difficulty: input.difficulty,
      questionBank: input.questionBank,
      transcript: input.transcript,
      userResponse: input.userResponse
    }));
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in processInterviewTurn AI call:", error);
    return { success: false, error: String(error) };
  }
}

export async function getInitialQuestion(input: { role: string, difficulty: string, questionBank?: string }) {
  try {
    const result = await withRetry(() => interviewTurn({
      role: input.role,
      difficulty: input.difficulty as any,
      questionBank: input.questionBank,
      transcript: [],
      userResponse: "The candidate has just entered the room. Please start the interview with an introduction."
    }));
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in getInitialQuestion:", error);
    return { success: false, error: String(error) };
  }
}

const MAX_RETRIES = 2;
const INITIAL_DELAY = 1000;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, delay = INITIAL_DELAY): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && String(error).includes("503")) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Firebase imports commented out - using local implementations
// import { addInterviewSession, getInterviewSession, getInterviewSessions, updateInterviewSession } from "@/lib/firestore";
import type { InterviewSession } from "@/lib/types";

// Deprecated actions removed

export async function createInterviewSession(session: Omit<InterviewSession, 'id' | 'date' | 'feedback' | 'transcript' | 'summaryReport' | 'violations'>) {
    const localId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Creating interview session with ID:', localId);
    MockSessions.push({
      ...session,
      id: localId,
      date: new Date().toISOString(),
      feedback: [],
      transcript: [],
      violations: [],
    });
    return { success: true, id: localId };
}

export async function saveInterviewSession(id: string, session: Omit<InterviewSession, 'id' | 'date' | 'role' | 'summaryReport'>) {
    console.log('Saving interview session:', id);
    const index = MockSessions.findIndex(s => s.id === id);
    if(index > -1) {
       MockSessions[index] = { ...MockSessions[index], ...session };
       return { success: true, id };
    }
    return { success: false, error: "Not found" };
}

export async function fetchInterviewSessions() {
    return MockSessions;
}

export async function fetchInterviewSession(id: string) {
    return MockSessions.find(s => s.id === id) || null;
}


const proctoringInputSchema = z.object({
  videoFrameDataUri: z.string(),
});

export async function checkProctoring(input: { videoFrameDataUri: string }) {
  try {
    const result = await analyzeFrameWithAzure(input.videoFrameDataUri);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in checkProctoring:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

import { analyzeFullInterview } from "@/ai/flows/full-interview-analysis";

export async function generateAndSaveSummaryReport(interviewId: string) {
  try {
    const session = MockSessions.find(s => s.id === interviewId);
    if (!session) {
      throw new Error("Interview session not found.");
    }

    const report = await analyzeFullInterview({
      role: session.role,
      transcript: session.transcript.map(m => ({ role: m.role as 'user' | 'ai', content: m.content })),
    });

    const index = MockSessions.findIndex(s => s.id === interviewId);
    if (index > -1) {
        MockSessions[index].summaryReport = report as any;
    }

    // Export to Azure Storage as Markdown
    await uploadReportToAzure(interviewId, report, session);

    return { success: true, data: report };
  } catch (error) {
    console.error("Error generating or saving summary report:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

async function uploadReportToAzure(interviewId: string, report: any, session: any) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const sasUrl = process.env.AZURE_STORAGE_SAS_URL;

    if (!connectionString && !sasUrl) {
        console.log(`[Mock Azure Report Upload] Saving report for ${interviewId} to local mock storage.`);
        return;
    }

    try {
        const { BlobServiceClient, ContainerClient } = await import("@azure/storage-blob");
        let containerClient;

        if (sasUrl) {
            containerClient = new ContainerClient(sasUrl);
        } else {
            const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString!);
            containerClient = blobServiceClient.getContainerClient("interview-reports");
            await containerClient.createIfNotExists();
        }

        const reportContent = formatReportToMarkdown(interviewId, report, session);
        const blockBlobClient = containerClient.getBlockBlobClient(`report_${interviewId}.md`);
        
        await blockBlobClient.upload(reportContent, reportContent.length, {
            blobHTTPHeaders: { blobContentType: "text/markdown" }
        });

        console.log(`Successfully uploaded report for ${interviewId} to Azure Storage.`);
    } catch (error) {
        console.error("Failed to upload report to Azure:", error);
    }
}

function formatReportToMarkdown(id: string, report: any, session: any): string {
    let md = `# Interview Report: ${session.role}\n`;
    md += `**Interview ID:** ${id}\n`;
    md += `**Date:** ${new Date(session.date).toLocaleString()}\n`;
    md += `**Overall Score:** ${report.overallScore}/100\n`;
    md += `**Duration:** ${session.duration} minutes\n`;
    md += `**Recommendation:** ${report.hiringRecommendation}\n\n`;

    md += `## Executive Summary\n${report.summary}\n\n`;

    md += `## Strengths\n`;
    report.strengths.forEach((s: string) => md += `- ${s}\n`);
    md += `\n`;

    md += `## Areas for Improvement\n`;
    report.weaknesses.forEach((w: string) => md += `- ${w}\n`);
    md += `\n`;

    md += `## Detailed Feedback\n`;
    md += `### Technical Assessment\n${report.technicalFeedback}\n\n`;
    md += `### Behavioral Assessment\n${report.behavioralFeedback}\n\n`;

    md += `## Question-by-Question Evaluation\n`;
    report.questionFeedback.forEach((q: any, i: number) => {
        md += `### Q${i + 1}: ${q.question}\n`;
        md += `**Score:** ${q.score}/100\n`;
        md += `**Feedback:** ${q.feedback}\n\n`;
    });

    md += `## Full Transcript\n`;
    session.transcript.forEach((m: any) => {
        md += `**${m.role.toUpperCase()}:** ${m.content}\n\n`;
    });

    return md;
}

export async function validateAadharAction(input: { imageUri: string }) {
  try {
    const result = await verifyAadharWithADI(input.imageUri);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error validating aadhar:", error);
    return { success: false, error: String(error) };
  }
}

export async function uploadRecordingChunk(formData: FormData) {
  const interviewId = formData.get("interviewId") as string;
  const chunkIndex = parseInt(formData.get("chunkIndex") as string, 10);
  const chunkFile = formData.get("chunk") as File | null;
  
  if (!chunkFile) return { success: false, error: "No chunk file" };

  const sasUrl = process.env.AZURE_STORAGE_SAS_URL;
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

  if (!sasUrl && !connectionString) {
      console.log(`[Mock Azure Upload] Received chunk ${chunkIndex} for ${interviewId}, size: ${chunkFile.size} bytes`);
      return { success: true };
  }

  try {
      const { BlobServiceClient, ContainerClient } = await import("@azure/storage-blob");
      let containerClient;

      if (sasUrl) {
        containerClient = new ContainerClient(sasUrl);
      } else {
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString!);
        containerClient = blobServiceClient.getContainerClient("interview-recordings");
        await containerClient.createIfNotExists();
      }

      const blobName = `${interviewId}.webm`;
      const appendBlobClient = containerClient.getAppendBlobClient(blobName);
      
      if (chunkIndex === 0) {
          // If using SAS, we assume container exists. 
          // AppendBlob create session if not exists.
          try {
            await appendBlobClient.createIfNotExists();
          } catch(e) {
            console.warn("Append Blob creation check:", e);
          }
      }

      const buffer = Buffer.from(await chunkFile.arrayBuffer());
      await appendBlobClient.appendBlock(buffer, buffer.length);
      
      return { success: true };
  } catch (error) {
      console.error("Error uploading chunk to azure:", error);
      return { success: false, error: String(error) };
  }
}
