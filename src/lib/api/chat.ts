// Chat and AI API services
import { apiClient } from '../api-client';
import { ChatSession, ChatMessage } from '../types';

export const chatAPI = {
  async createChatSession(workspaceId: number): Promise<ChatSession> {
    return await apiClient.post('/chat/sessions', {
      workspace_id: workspaceId,
    });
  },

  async getChatMessages(sessionId: string): Promise<{ messages: ChatMessage[] }> {
    return await apiClient.get(`/chat/sessions/${sessionId}/messages`);
  },

  async sendMessage(sessionId: string, content: string): Promise<ChatMessage> {
    return await apiClient.post(`/chat/sessions/${sessionId}/messages`, {
      content,
    });
  },
};