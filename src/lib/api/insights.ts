// Insights API services
import { apiClient } from '../api-client';
import { GeneratedInsight } from '../types';

export const insightsAPI = {
  async getInsights(filters?: {
    workspace_id?: number;
    insight_type?: string;
    limit?: number;
  }): Promise<{
    insights: GeneratedInsight[];
    total: number;
    page: number;
    per_page: number;
  }> {
    const params = new URLSearchParams();
    if (filters?.workspace_id) params.append('workspace_id', filters.workspace_id.toString());
    if (filters?.insight_type) params.append('insight_type', filters.insight_type);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const endpoint = `/insights${params.toString() ? `?${params.toString()}` : ''}`;
    return await apiClient.get(endpoint);
  },

  async generateInsight(data: {
    workspace_id: number;
    query: string;
    insight_type?: string;
  }): Promise<GeneratedInsight> {
    return await apiClient.post('/insights/generate', data);
  },

  async getInsight(insightId: number): Promise<GeneratedInsight> {
    return await apiClient.get(`/insights/${insightId}`);
  },

  async exportInsight(
    insightId: number,
    options: {
      format: 'png' | 'pdf' | 'csv' | 'xlsx';
      width?: number;
      height?: number;
    }
  ): Promise<{
    download_url: string;
    expires_at: string;
  }> {
    return await apiClient.post(`/insights/${insightId}/export`, options);
  },
};