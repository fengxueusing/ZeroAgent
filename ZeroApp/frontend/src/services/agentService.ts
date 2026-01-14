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

export const saveDraft = async (filename: string, content: string): Promise<{ status: string, filename: string }> => {
  const response = await api.post('/history/drafts', { filename, content });
  return response.data;
};

export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  updated_at: number;
  size: number;
  preview?: string;
}

export const listDrafts = async (path: string = ""): Promise<FileSystemItem[]> => {
  const response = await api.get('/history/drafts', { params: { path } });
  return response.data;
};

export const createFolder = async (path: string): Promise<{ status: string, path: string }> => {
  const response = await api.post('/history/folders', { path });
  return response.data;
};

export const deleteItem = async (path: string): Promise<{ status: string, deleted: string }> => {
  // Use encodeURIComponent to handle slashes in path
  const response = await api.delete(`/history/drafts/${encodeURIComponent(path)}`);
  return response.data;
};

export const moveItem = async (source: string, destination: string): Promise<{ status: string, from: string, to: string }> => {
  const response = await api.post('/history/move', { source, destination });
  return response.data;
};

export const getDraft = async (filename: string): Promise<{ filename: string, content: string, updated_at: number }> => {
  // Filename here is actually a path
  const response = await api.get(`/history/drafts/${encodeURIComponent(filename)}`);
  return response.data;
};
