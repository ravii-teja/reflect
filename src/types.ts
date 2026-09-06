export type Role = 'user' | 'model' | 'system';

export type MemoryType = 'insight' | 'decision' | 'goal' | 'theme' | 'open_loop';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isAnonymous?: boolean;
  dateOfBirth?: string; // YYYY-MM-DD
  location?: string; // e.g. "San Francisco, CA"
  bio?: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
  tokenCount?: number;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'archived' | 'reflected';
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  reflectionId?: string;
}

export interface EmotionalDetails {
  primaryEmotion: string;
  valence: 'positive' | 'grounded' | 'contemplative' | 'challenging' | 'mixed';
  intensity: 'subtle' | 'moderate' | 'deep';
  emotionalArc: string;
  underlyingNeeds: string[];
  somaticTakeaway: string;
}

export interface Reflection {
  id: string;
  userId: string;
  conversationId: string;
  summary: string;
  themes: string[];
  insights: string[];
  decisions: string[];
  openLoops: string[];
  futurePrompts: string[];
  emotionalDetails?: EmotionalDetails;
  createdAt: string;
}

export interface Memory {
  id: string;
  userId: string;
  type: MemoryType;
  content: string;
  rawPlaintext?: string; // Client-side decrypted copy
  isEncrypted: boolean;
  iv?: string;
  sourceReflectionId?: string;
  importance: number; // 1 to 5
  createdAt: string;
  updatedAt?: string;
}

export interface SecurityMetricLog {
  id: string;
  timestamp: string;
  method: string;
  route: string;
  statusCode: number;
  latencyMs: number;
  userHash: string;
  action: string;
}

export interface SecurityAuditResult {
  testName: string;
  description: string;
  passed: boolean;
  httpStatus: number;
  evidence: string;
}

export interface ChatCompletionResponse {
  reply: string;
  messageId: string;
  retrievedMemories: { id: string; type: string; snippet: string }[];
  model: string;
  tokensUsed?: number;
}
