
// Firestore operations - COMPLETELY DISABLED
// All database operations now use local/stub implementations
// NO FIREBASE IMPORTS - This prevents any Firebase connections

// Original Firebase code removed to prevent initialization
// Code saved in FIREBASE_SETUP.md for future reference

"use server";
import type {InterviewSession} from './types';

// STUB IMPLEMENTATIONS - No database operations
// These functions return success without actually saving data

export async function addInterviewSession(
  session: Omit<InterviewSession, 'id' | 'date' | 'feedback' | 'transcript' | 'summaryReport'>
) {
  console.log('addInterviewSession - using stub implementation:', session);
  const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return {success: true, id: localId};
}

export async function updateInterviewSession(
  id: string,
  session: Partial<Omit<InterviewSession, 'id' | 'date' | 'role'>>
) {
  console.log('updateInterviewSession - using stub implementation:', id, session);
  return {success: true, id};
}

export async function getInterviewSessions(): Promise<InterviewSession[]> {
  console.log('getInterviewSessions - using stub implementation, returning empty array');
  return [];
}

export async function getInterviewSession(id: string): Promise<InterviewSession | null> {
  console.log('getInterviewSession - using stub implementation, returning null for:', id);
  return null;
}
