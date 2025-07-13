// Workspace management API services
import { apiClient } from '../api-client';
import { Workspace } from '../types';

export const workspacesAPI = {
  async createWorkspace(data: {
    name: string;
    description: string;
    file_ids?: number[];
  }): Promise<Workspace> {
    return await apiClient.post('/workspaces', data);
  },

  async getWorkspaces(): Promise<{ workspaces: Workspace[] }> {
    return await apiClient.get('/workspaces');
  },

  async getWorkspace(workspaceId: number): Promise<Workspace> {
    return await apiClient.get(`/workspaces/${workspaceId}`);
  },

  async updateWorkspace(
    workspaceId: number,
    updates: {
      name?: string;
      description?: string;
      file_ids?: number[];
    }
  ): Promise<Workspace> {
    return await apiClient.put(`/workspaces/${workspaceId}`, updates);
  },

  async deleteWorkspace(workspaceId: number): Promise<{ message: string }> {
    return await apiClient.delete(`/workspaces/${workspaceId}`);
  },
};