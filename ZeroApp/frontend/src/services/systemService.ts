import api from '../lib/api';

export interface EngineStatus {
  void_level: number;
  carbon_level: number;
  rpm: number;
  mode: string;
}

export interface SystemStatus {
  status: EngineStatus;
  is_hunting: boolean;
  message: string;
}

export const getSystemStatus = async (): Promise<SystemStatus> => {
  const response = await api.get('/agent/status');
  return response.data;
};
