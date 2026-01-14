import api from '../lib/api';

export interface Conversation {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  message_count?: number;
  tags?: string[];
  messages?: any[]; // Full details when fetching single
}

export const historyService = {
  listConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/history/conversations');
    return response.data;
  },

  createConversation: async (title: string = "New Chat"): Promise<Conversation> => {
    const response = await api.post('/history/conversations', { title });
    return response.data;
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const response = await api.get(`/history/conversations/${id}`);
    return response.data;
  },

  updateConversation: async (id: string, updates: Partial<Conversation>): Promise<Conversation> => {
    const response = await api.put(`/history/conversations/${id}`, updates);
    return response.data;
  },

  deleteConversation: async (id: string): Promise<void> => {
    await api.delete(`/history/conversations/${id}`);
  },

  searchConversations: async (query: string, limit: number = 20): Promise<any[]> => {
    const response = await api.get('/history/search', { params: { q: query, limit } });
    return response.data;
  }
};
