// Dashboard API services
import { apiClient } from '../api-client';
import { Dashboard, DashboardWidget } from '../types';

export const dashboardsAPI = {
  async getDashboards(): Promise<{ dashboards: Dashboard[] }> {
    return await apiClient.get('/dashboards');
  },

  async createDashboard(data: {
    name: string;
    description: string;
  }): Promise<Dashboard> {
    return await apiClient.post('/dashboards', data);
  },

  async getDashboard(dashboardId: number): Promise<Dashboard> {
    return await apiClient.get(`/dashboards/${dashboardId}`);
  },

  async updateDashboard(
    dashboardId: number,
    updates: {
      name?: string;
      description?: string;
      layout?: any;
    }
  ): Promise<Dashboard> {
    return await apiClient.put(`/dashboards/${dashboardId}`, updates);
  },

  async deleteDashboard(dashboardId: number): Promise<{ message: string }> {
    return await apiClient.delete(`/dashboards/${dashboardId}`);
  },

  async addWidget(
    dashboardId: number,
    data: {
      insight_id: number;
      position_x: number;
      position_y: number;
      width: number;
      height: number;
    }
  ): Promise<DashboardWidget> {
    return await apiClient.post(`/dashboards/${dashboardId}/widgets`, data);
  },

  async updateWidget(
    dashboardId: number,
    widgetId: number,
    updates: {
      position_x?: number;
      position_y?: number;
      width?: number;
      height?: number;
    }
  ): Promise<DashboardWidget> {
    return await apiClient.put(`/dashboards/${dashboardId}/widgets/${widgetId}`, updates);
  },

  async removeWidget(
    dashboardId: number,
    widgetId: number
  ): Promise<{ message: string }> {
    return await apiClient.delete(`/dashboards/${dashboardId}/widgets/${widgetId}`);
  },

  async exportDashboard(
    dashboardId: number,
    options: {
      format: 'pdf' | 'png' | 'xlsx';
      include_data?: boolean;
      template?: string;
    }
  ): Promise<{
    export_id: string;
    download_url: string;
    expires_at: string;
    status: 'processing' | 'completed' | 'failed';
  }> {
    return await apiClient.post(`/dashboards/${dashboardId}/export`, options);
  },
};