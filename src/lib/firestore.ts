
// Firestore operations - COMPLETELY COMMENTED OUT
// All database operations now use local/stub implementations
// Uncomment the sections below when you want to enable Firebase persistence

/*
"use server";
import {db, isFirebaseConfigured} from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import type {InterviewSession} from './types';

// Helper function to sanitize data for Firestore
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (typeof obj === 'function') {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)).filter(item => item !== null);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedValue = sanitizeForFirestore(value);
      if (sanitizedValue !== null && sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }
    }
    return sanitized;
  }
  
  return obj;
}
*/

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
