export type InterviewSettings = {
  role: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string;
  questionBank?: string;
};

export type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

export type Feedback = {
  feedback: string;
  suggestions: string;
};

export type InterviewSession = {
  id: string;
  date: string;
  role: string;
  score: number;
  duration: string;
};
