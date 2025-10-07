
"use server";
import {db} from '@/lib/firebase';
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

export async function addInterviewSession(
  session: Omit<InterviewSession, 'id' | 'date' | 'feedback' | 'transcript' | 'summaryReport'>
) {
  try {
    const sanitizedSession = sanitizeForFirestore({
      ...session,
      date: new Date().toISOString(),
      feedback: [],
      transcript: [],
      summaryReport: null,
    });
    
    const docRef = await addDoc(collection(db, 'interviewSessions'), sanitizedSession);
    return {success: true, id: docRef.id};
  } catch (e) {
    console.error('Error adding document: ', e);
    return {success: false, error: 'Failed to save session.'};
  }
}

export async function updateInterviewSession(
  id: string,
  session: Partial<Omit<InterviewSession, 'id' | 'date' | 'role'>>
) {
  try {
    const sessionRef = doc(db, 'interviewSessions', id);
    const sanitizedSession = sanitizeForFirestore(session);
    
    // Remove empty or null fields to avoid Firestore issues
    const cleanSession = Object.fromEntries(
      Object.entries(sanitizedSession).filter(([_, value]) => 
        value !== null && value !== undefined && value !== ''
      )
    );
    
    await updateDoc(sessionRef, cleanSession);
    return {success: true, id };
  } catch (e) {
    console.error('Error updating document: ', e);
    return {success: false, error: 'Failed to update session.'};
  }
}

export async function getInterviewSessions(): Promise<InterviewSession[]> {
  try {
    const q = query(
      collection(db, 'interviewSessions'),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const sessions: InterviewSession[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        role: data.role,
        date: data.date,
        duration: data.duration,
        score: data.score,
        feedback: data.feedback,
        transcript: data.transcript,
        summaryReport: data.summaryReport || null,
      });
    });
    return sessions;
  } catch (e) {
    console.error('Error getting documents: ', e);
    return [];
  }
}

export async function getInterviewSession(id: string): Promise<InterviewSession | null> {
    try {
        const docRef = doc(db, 'interviewSessions', id);
        const docSnap = await getDoc(docRef);

        if(docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                role: data.role,
                date: data.date,
                duration: data.duration,
                score: data.score,
                feedback: data.feedback,
                transcript: data.transcript,
                summaryReport: data.summaryReport || null,
            }
        } else {
            return null;
        }
    } catch(e) {
        console.error('Error getting document: ', e);
        return null;
    }
}
