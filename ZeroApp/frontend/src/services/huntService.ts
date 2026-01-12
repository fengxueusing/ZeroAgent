import api from '../lib/api';

export interface PreyItem {
  title: string;
  url: string;
  content: string;
  score: number;
  entropy?: number;
  source?: string;
}

export interface EngineStatus {
  void_level: number;
  carbon_level: number;
  rpm: number;
}

export interface HuntResponse {
  message: string;
  prey: PreyItem[];
  reactions: string[];
  engine_status: EngineStatus;
}

export const triggerHunt = async (topic: string): Promise<HuntResponse> => {
  const response = await api.post('/hunt/hunt', null, {
    params: { topic }
  });
  return response.data;
};
