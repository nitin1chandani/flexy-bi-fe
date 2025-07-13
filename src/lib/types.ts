// TypeScript types for API responses

export interface User {
  id: number;
  name: string;
  email: string;
  subscription_plan: string;
  api_usage_count: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UploadedFile {
  id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_type: 'xlsx' | 'csv';
  file_size: number;
  status: 'processing' | 'completed' | 'failed';
  metadata?: FileMetadata;
  created_at: string;
}

export interface FileMetadata {
  columns: string[];
  column_types: Record<string, 'text' | 'number' | 'date' | 'boolean'>;
  row_count: number;
  sample_data: Record<string, any>[];
}

export interface Workspace {
  id: number;
  name: string;
  description: string;
  files: UploadedFile[];
  chat_sessions?: ChatSession[];
  insights_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: number;
  workspace_id: number;
  session_id: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  message_type: 'user' | 'assistant';
  content: string;
  metadata?: ChatMessageMetadata;
  chart_data?: ChartData;
  created_at: string;
}

export interface ChatMessageMetadata {
  insight_id?: number;
  processing_time?: number;
  tokens_used?: number;
  error_message?: string;
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'doughnut';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
      borderWidth?: number;
    }[];
  };
  options?: any;
  insights?: string[];
}

export interface WebSocketMessage {
  type: 'user_message' | 'ai_response';
  content: string;
  data?: {
    insight_id?: number;
    chart_config?: any;
    chart_data?: any;
  };
}

export interface GeneratedInsight {
  id: number;
  workspace_id: number;
  chat_message_id?: number;
  insight_type: 'line_chart' | 'bar_chart' | 'pie_chart' | 'table' | 'kpi';
  title: string;
  description: string;
  chart_config: any;
  data: any;
  sql_query: string;
  created_at: string;
}

export interface Dashboard {
  id: number;
  name: string;
  description: string;
  layout?: DashboardLayout;
  widgets: DashboardWidget[];
  widgets_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardLayout {
  grid_cols: number;
  grid_rows: number;
}

export interface DashboardWidget {
  id: number;
  insight: GeneratedInsight;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

export interface APIErrorResponse {
  error: string;
  message?: string;
  code?: string;
}