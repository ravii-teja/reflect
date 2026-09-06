import { Conversation, Message, Reflection, Memory, SecurityMetricLog, SecurityAuditResult, ChatCompletionResponse, UserProfile } from '../types';
import { encryptText, decryptText } from '../utils/crypto';

export class ApiService {
  private static async fetchWithAuth(url: string, token: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errBody.error || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  static async getConversations(token: string): Promise<Conversation[]> {
    return this.fetchWithAuth('/api/conversations', token);
  }

  static async getConversation(id: string, token: string): Promise<Conversation> {
    return this.fetchWithAuth(`/api/conversations/${encodeURIComponent(id)}`, token);
  }

  static async createConversation(
    token: string,
    title?: string,
    initialPrompt?: string
  ): Promise<Conversation> {
    return this.fetchWithAuth('/api/conversations', token, {
      method: 'POST',
      body: JSON.stringify({ title, initialPrompt })
    });
  }

  static async sendMessage(
    conversationId: string,
    content: string,
    token: string,
    decryptedMemoriesContext?: string[]
  ): Promise<ChatCompletionResponse> {
    return this.fetchWithAuth(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, token, {
      method: 'POST',
      body: JSON.stringify({
        content,
        clientContextMemories: decryptedMemoriesContext || []
      })
    });
  }

  static async generateReflection(
    conversationId: string,
    token: string
  ): Promise<{ reflection: Reflection; createdMemories: Memory[] }> {
    return this.fetchWithAuth(`/api/conversations/${encodeURIComponent(conversationId)}/reflect`, token, {
      method: 'POST'
    });
  }

  static async getReflections(token: string): Promise<Reflection[]> {
    return this.fetchWithAuth('/api/reflections', token);
  }

  static async getMemories(token: string, cryptoKey?: CryptoKey | null): Promise<Memory[]> {
    const rawMemories: Memory[] = await this.fetchWithAuth('/api/memories', token);
    
    // Decrypt E2EE memories client-side if a crypto key is active
    if (!cryptoKey) {
      return rawMemories.map(m => ({
        ...m,
        rawPlaintext: m.isEncrypted ? '[🔒 End-to-end encrypted]' : m.content
      }));
    }

    const decrypted = await Promise.all(
      rawMemories.map(async (mem) => {
        if (mem.isEncrypted && mem.iv) {
          try {
            const plain = await decryptText(mem.content, mem.iv, cryptoKey);
            return { ...mem, rawPlaintext: plain };
          } catch (e) {
            return { ...mem, rawPlaintext: '[Decryption Error]' };
          }
        }
        return { ...mem, rawPlaintext: mem.content };
      })
    );

    return decrypted;
  }

  static async createMemory(
    memory: { type: string; content: string; importance?: number; sourceReflectionId?: string },
    token: string,
    cryptoKey?: CryptoKey | null
  ): Promise<Memory> {
    let contentToStore = memory.content;
    let isEncrypted = false;
    let iv: string | undefined = undefined;

    if (cryptoKey) {
      const encrypted = await encryptText(memory.content, cryptoKey);
      contentToStore = encrypted.ciphertext;
      iv = encrypted.iv;
      isEncrypted = true;
    }

    const result = await this.fetchWithAuth('/api/memories', token, {
      method: 'POST',
      body: JSON.stringify({
        type: memory.type,
        content: contentToStore,
        isEncrypted,
        iv,
        importance: memory.importance || 3,
        sourceReflectionId: memory.sourceReflectionId
      })
    });

    return {
      ...result,
      rawPlaintext: memory.content
    };
  }

  static async deleteMemory(id: string, token: string): Promise<{ success: boolean }> {
    return this.fetchWithAuth(`/api/memories/${encodeURIComponent(id)}`, token, {
      method: 'DELETE'
    });
  }

  static async getUserProfile(token: string): Promise<UserProfile> {
    return this.fetchWithAuth('/api/profile', token);
  }

  static async updateUserProfile(
    profile: { dateOfBirth?: string; location?: string; displayName?: string; bio?: string },
    token: string
  ): Promise<UserProfile> {
    return this.fetchWithAuth('/api/profile', token, {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
  }

  static async getInsights(token: string): Promise<any> {
    return this.fetchWithAuth('/api/insights', token);
  }

  static async getHealth(): Promise<{ status: string; uptime: number; timestamp: string }> {
    const res = await fetch('/api/health');
    return res.json();
  }

  static async getSecurityMetrics(token: string): Promise<{
    logs: SecurityMetricLog[];
    rateLimitRemaining: number;
    activeUidHash: string;
    totalMemories: number;
    totalReflections: number;
  }> {
    return this.fetchWithAuth('/api/security/metrics', token);
  }

  static async runSecurityAuditSuite(token: string): Promise<SecurityAuditResult[]> {
    return this.fetchWithAuth('/api/security/audit', token, {
      method: 'POST'
    });
  }
}
