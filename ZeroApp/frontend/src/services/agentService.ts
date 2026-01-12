import api from '../lib/api';

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  source?: string;
}

export interface TrendReport {
  topic: string;
  keywords: string[];
  summary: string;
  inspiration_points: string[];
}

export interface WritingMethod {
  method_name: string;
  core_logic: string;
  structure_template: string;
}

export const analyzeTrends = async (results: SearchResult[]): Promise<TrendReport> => {
  const response = await api.post('/agent/analyze', results);
  return response.data;
};

export const learnMethods = async (results: SearchResult[]): Promise<WritingMethod[]> => {
  const response = await api.post('/agent/learn', results);
  return response.data;
};

export const writeScript = async (trend: TrendReport, method: WritingMethod): Promise<{ script: string }> => {
  const response = await api.post('/agent/write', { trend, method });
  return response.data;
};

export const refineScript = async (script: string, instruction: string): Promise<{ script: string }> => {
  const response = await api.post('/agent/refine', { script, instruction });
  return response.data;
};

export const saveDraft = async (filename: string, content: string): Promise<{ status: string, path: string }> => {
  const response = await api.post('/agent/save', { filename, content });
  return response.data;
};

export interface DraftFile {
  filename: string;
  path: string;
  updated_at: string;
  size: number;
}

export const listDrafts = async (): Promise<DraftFile[]> => {
  const response = await api.get('/agent/drafts');
  return response.data;
};

export const getDraft = async (filename: string): Promise<{ filename: string, content: string }> => {
  const response = await api.get(`/agent/drafts/${filename}`);
  return response.data;
};
