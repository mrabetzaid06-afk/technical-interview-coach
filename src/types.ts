/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  educationLevel: string;
  programmingLanguages: string[];
  targetRole: string;
  experienceLevel: 'Beginner' | 'Junior' | 'Intermediate' | 'Advanced';
}

export type InterviewCategory =
  | 'Programming'
  | 'Data Structures'
  | 'Algorithms'
  | 'Databases'
  | 'Operating Systems'
  | 'Networking'
  | 'Object-Oriented Programming'
  | 'System Design'
  | 'Behavioral';

export interface PerformanceStats {
  problemSolving: number; // 0 - 100
  coding: number;         // 0 - 100
  communication: number;  // 0 - 100
  computerScience: number; // 0 - 100
}

export interface Evaluation {
  score: number; // 0 to 10
  strengths: string[];
  weaknesses: string[];
  betterAnswer: string;
  evaluatedAnswer: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  category?: InterviewCategory;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  questionNumber?: number;
  evaluation?: Evaluation;
  hintUsed?: boolean;
}

export interface InterviewSession {
  profile: UserProfile;
  messages: ChatMessage[];
  currentIdx: number; // total question-response sequences, up to 10 or more
  performance: PerformanceStats;
  isActive: boolean;
  isCompleted: boolean;
}
