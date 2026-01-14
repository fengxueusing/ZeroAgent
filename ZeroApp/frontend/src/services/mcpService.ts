import api from '../lib/api';

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
}

export interface MCPServerStatus {
  name: string;
  config: MCPServerConfig;
  status: 'connected' | 'disconnected' | 'disabled' | 'error';
}

export const getMCPServers = async (): Promise<MCPServerStatus[]> => {
  const response = await api.get('/mcp/servers');
  return response.data;
};

export const addMCPServer = async (config: MCPServerConfig): Promise<any> => {
  const response = await api.post('/mcp/servers', config);
  return response.data;
};

export const updateMCPServer = async (name: string, config: MCPServerConfig): Promise<any> => {
  const response = await api.put(`/mcp/servers/${name}`, config);
  return response.data;
};

export const removeMCPServer = async (name: string): Promise<any> => {
  const response = await api.delete(`/mcp/servers/${name}`);
  return response.data;
};
