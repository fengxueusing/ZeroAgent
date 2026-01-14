import api from '../lib/api';

export interface SettingsState {
  llm_provider: string;
  llm_key: string;
  llm_base_url: string;
  llm_model: string;
  tavily_key: string;
  github_token: string;
  llm_configured: boolean;
  tavily_configured: boolean;
  github_configured: boolean;
  agent_bio?: string;
}

export const getSettings = async (): Promise<SettingsState> => {
  // Use trailing slash to avoid 307 Redirects which might cause issues in some environments
  const response = await api.get('/settings/');
  return response.data;
};

export const updateSettings = async (data: Partial<SettingsState>): Promise<{ status: string; message: string }> => {
  const response = await api.post('/settings', data);
  return response.data;
};

export const testLLMConnection = async (data: Partial<SettingsState>): Promise<{ status: string; message: string }> => {
  const response = await api.post('/settings/test-llm', data);
  return response.data;
};

export const uploadAvatar = async (file: File): Promise<{ status: string; url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/settings/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAvatarUrl = () => {
  // Use a constant or env var in production
  const baseUrl = 'http://localhost:8000'; 
  return `${baseUrl}/static/avatar.png?t=${Date.now()}`;
};
