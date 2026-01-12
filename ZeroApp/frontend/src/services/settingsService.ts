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
}

export const getSettings = async (): Promise<SettingsState> => {
  const response = await api.get('/settings');
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
