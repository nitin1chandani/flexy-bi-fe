# Frontend Integration Guide

This document provides comprehensive guidance for integrating frontend applications with the Flexy BI backend API.

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [WebSocket Integration](#websocket-integration)
4. [File Upload](#file-upload)
5. [Error Handling](#error-handling)
6. [Code Examples](#code-examples)
7. [TypeScript Definitions](#typescript-definitions)
8. [Best Practices](#best-practices)

## Authentication

### JWT Token Management

The API uses JWT tokens for authentication. All protected endpoints require the `Authorization` header.

```javascript
// Store token after login
const token = response.data.token;
localStorage.setItem('auth_token', token);

// Add to all API requests
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
});
```

### Login Flow

```javascript
// User registration
const register = async (userData) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('auth_token', data.token);
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// User login
const login = async (email, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('auth_token', data.token);
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// Token refresh
const refreshToken = async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};
```

## API Endpoints

### File Management

```javascript
// Upload file
const uploadFile = async (file, name = '') => {
  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);
  
  try {
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: formData
    });
    
    return await response.json();
  } catch (error) {
    throw new Error('Upload failed');
  }
};

// Get files list
const getFiles = async () => {
  const response = await apiClient.get('/files');
  return response.data.files;
};

// Get file preview
const getFilePreview = async (fileId) => {
  const response = await apiClient.get(`/files/${fileId}/preview`);
  return response.data;
};

// Check file processing status
const getFileStatus = async (fileId) => {
  const response = await apiClient.get(`/files/${fileId}/status`);
  return response.data;
};

// Delete file
const deleteFile = async (fileId) => {
  await apiClient.delete(`/files/${fileId}`);
};
```

### Workspace Management

```javascript
// Create workspace
const createWorkspace = async (workspaceData) => {
  const response = await apiClient.post('/workspaces', {
    name: workspaceData.name,
    description: workspaceData.description,
    file_ids: workspaceData.fileIds || []
  });
  return response.data;
};

// Get workspaces
const getWorkspaces = async () => {
  const response = await apiClient.get('/workspaces');
  return response.data.workspaces;
};

// Get workspace details
const getWorkspace = async (workspaceId) => {
  const response = await apiClient.get(`/workspaces/${workspaceId}`);
  return response.data;
};

// Update workspace
const updateWorkspace = async (workspaceId, updates) => {
  const response = await apiClient.put(`/workspaces/${workspaceId}`, updates);
  return response.data;
};

// Delete workspace
const deleteWorkspace = async (workspaceId) => {
  await apiClient.delete(`/workspaces/${workspaceId}`);
};
```

### Chat Integration

```javascript
// Create chat session
const createChatSession = async (workspaceId) => {
  const response = await apiClient.post('/chat/sessions', {
    workspace_id: workspaceId
  });
  return response.data;
};

// Get chat messages
const getChatMessages = async (sessionId) => {
  const response = await apiClient.get(`/chat/sessions/${sessionId}/messages`);
  return response.data.messages;
};

// Send message (REST API)
const sendMessage = async (sessionId, content) => {
  const response = await apiClient.post(`/chat/sessions/${sessionId}/messages`, {
    content: content
  });
  return response.data;
};
```

## WebSocket Integration

### Real-time Chat Implementation

```javascript
class ChatWebSocket {
  constructor(sessionId, token) {
    this.sessionId = sessionId;
    this.token = token;
    this.ws = null;
    this.messageHandlers = [];
    this.connectionHandlers = [];
  }
  
  connect() {
    const wsUrl = `ws://localhost:8080/ws/chat/${this.sessionId}`;
    this.ws = new WebSocket(wsUrl);
    
    // Set authorization header (if your WebSocket implementation supports it)
    // Alternative: pass token as query parameter
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.connectionHandlers.forEach(handler => handler('connected'));
    };
    
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(message));
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.connectionHandlers.forEach(handler => handler('disconnected'));
      // Implement reconnection logic
      setTimeout(() => this.connect(), 3000);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.connectionHandlers.forEach(handler => handler('error'));
    };
  }
  
  sendMessage(content) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'user_message',
        content: content
      }));
    } else {
      console.error('WebSocket not connected');
    }
  }
  
  onMessage(handler) {
    this.messageHandlers.push(handler);
  }
  
  onConnection(handler) {
    this.connectionHandlers.push(handler);
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage example
const chatWS = new ChatWebSocket(sessionId, authToken);

chatWS.onMessage((message) => {
  if (message.type === 'ai_response') {
    displayMessage(message.content, 'assistant');
    
    // Handle insights/charts if present
    if (message.data && message.data.insight_id) {
      renderInsight(message.data);
    }
  }
});

chatWS.onConnection((status) => {
  updateConnectionStatus(status);
});

chatWS.connect();

// Send message
chatWS.sendMessage('Show me Q1 revenue trends');
```

### React Hook for WebSocket

```javascript
import { useState, useEffect, useRef } from 'react';

export const useChatWebSocket = (sessionId, token) => {
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const wsRef = useRef(null);
  
  useEffect(() => {
    if (!sessionId || !token) return;
    
    const ws = new WebSocket(`ws://localhost:8080/ws/chat/${sessionId}`);
    wsRef.current = ws;
    
    ws.onopen = () => setConnectionStatus('connected');
    ws.onclose = () => setConnectionStatus('disconnected');
    ws.onerror = () => setConnectionStatus('error');
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };
    
    return () => {
      ws.close();
    };
  }, [sessionId, token]);
  
  const sendMessage = (content) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'user_message',
        content
      }));
      
      // Add user message to local state
      setMessages(prev => [...prev, {
        type: 'user_message',
        content,
        created_at: new Date().toISOString()
      }]);
    }
  };
  
  return { messages, connectionStatus, sendMessage };
};
```

## File Upload

### Drag and Drop Implementation

```javascript
const FileUploadComponent = () => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.type === 'text/csv' || 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    
    for (const file of validFiles) {
      await uploadFileWithProgress(file);
    }
  };
  
  const uploadFileWithProgress = async (file) => {
    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        // Poll for processing status
        pollFileStatus(result.id);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };
  
  const pollFileStatus = async (fileId) => {
    const interval = setInterval(async () => {
      try {
        const status = await getFileStatus(fileId);
        setUploadProgress(status.progress);
        
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
          setUploadProgress(100);
          // Refresh file list
          refreshFiles();
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 1000);
  };
  
  return (
    <div
      className={`upload-area ${dragOver ? 'drag-over' : ''}`}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
    >
      {uploading ? (
        <div>
          <p>Uploading... {uploadProgress}%</p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <p>Drag and drop Excel or CSV files here</p>
      )}
    </div>
  );
};
```

### Insights and Dashboards

```javascript
// Get insights
const getInsights = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.workspace_id) params.append('workspace_id', filters.workspace_id);
  if (filters.insight_type) params.append('insight_type', filters.insight_type);
  if (filters.limit) params.append('limit', filters.limit);

  const response = await apiClient.get(`/insights?${params}`);
  return response.data;
};

// Generate insight
const generateInsight = async (workspaceId, query, insightType = '') => {
  const response = await apiClient.post('/insights/generate', {
    workspace_id: workspaceId,
    query: query,
    insight_type: insightType
  });
  return response.data;
};

// Get dashboards
const getDashboards = async () => {
  const response = await apiClient.get('/dashboards');
  return response.data.dashboards;
};

// Create dashboard
const createDashboard = async (name, description) => {
  const response = await apiClient.post('/dashboards', {
    name: name,
    description: description
  });
  return response.data;
};

// Add widget to dashboard
const addWidget = async (dashboardId, insightId, position) => {
  const response = await apiClient.post(`/dashboards/${dashboardId}/widgets`, {
    insight_id: insightId,
    position_x: position.x,
    position_y: position.y,
    width: position.width,
    height: position.height
  });
  return response.data;
};
```

## Error Handling

### Centralized Error Handler

```javascript
class APIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'APIError';
  }
}

const handleAPIResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(
      errorData.error || 'An error occurred',
      response.status,
      errorData.code
    );
  }
  return response.json();
};

// Enhanced API client with error handling
const createAPIClient = (baseURL, getToken) => {
  return {
    async request(endpoint, options = {}) {
      const token = getToken();
      const url = `${baseURL}${endpoint}`;

      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        ...options
      };

      try {
        const response = await fetch(url, config);
        return await handleAPIResponse(response);
      } catch (error) {
        if (error instanceof APIError) {
          // Handle specific API errors
          if (error.status === 401) {
            // Token expired, try to refresh
            const refreshed = await refreshToken();
            if (refreshed) {
              // Retry the request
              return this.request(endpoint, options);
            } else {
              // Redirect to login
              window.location.href = '/login';
            }
          }
        }
        throw error;
      }
    },

    get(endpoint) {
      return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, data) {
      return this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    put(endpoint, data) {
      return this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    delete(endpoint) {
      return this.request(endpoint, { method: 'DELETE' });
    }
  };
};

// Usage
const api = createAPIClient('http://localhost:8080/api', () => localStorage.getItem('auth_token'));
```

## TypeScript Definitions

```typescript
// types/api.ts

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
  created_at: string;
}

export interface ChatMessageMetadata {
  insight_id?: number;
  processing_time?: number;
  tokens_used?: number;
  error_message?: string;
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

export interface APIError {
  error: string;
  message?: string;
  code?: string;
}
```

## React Components Examples

### File Upload Component

```typescript
// components/FileUpload.tsx
import React, { useState, useCallback } from 'react';
import { UploadedFile } from '../types/api';

interface FileUploadProps {
  onUploadComplete: (file: UploadedFile) => void;
  onUploadError: (error: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.includes('csv') && !file.type.includes('spreadsheet')) {
      onUploadError('Please upload only CSV or Excel files');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadFile(file);

      // Poll for completion
      const pollStatus = setInterval(async () => {
        const status = await getFileStatus(result.id);
        setProgress(status.progress);

        if (status.status === 'completed') {
          clearInterval(pollStatus);
          setUploading(false);
          onUploadComplete(result);
        } else if (status.status === 'failed') {
          clearInterval(pollStatus);
          setUploading(false);
          onUploadError('File processing failed');
        }
      }, 1000);

    } catch (error) {
      setUploading(false);
      onUploadError('Upload failed');
    }
  }, [onUploadComplete, onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  return (
    <div
      className={`file-upload ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
    >
      {uploading ? (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p>Processing... {progress}%</p>
        </div>
      ) : (
        <div className="upload-prompt">
          <p>Drag and drop your Excel or CSV file here</p>
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
```

### Chat Component

```typescript
// components/Chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, WebSocketMessage } from '../types/api';
import { useChatWebSocket } from '../hooks/useChatWebSocket';

interface ChatProps {
  sessionId: string;
  workspaceId: number;
}

export const Chat: React.FC<ChatProps> = ({ sessionId, workspaceId }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages: wsMessages,
    connectionStatus,
    sendMessage
  } = useChatWebSocket(sessionId, localStorage.getItem('auth_token') || '');

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const initialMessages = await getChatMessages(sessionId);
        setMessages(initialMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [sessionId]);

  // Handle new WebSocket messages
  useEffect(() => {
    if (wsMessages.length > 0) {
      const latestMessage = wsMessages[wsMessages.length - 1];
      if (latestMessage.type === 'ai_response') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          session_id: parseInt(sessionId),
          message_type: 'assistant',
          content: latestMessage.content,
          created_at: new Date().toISOString()
        }]);
      }
    }
  }, [wsMessages, sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Add user message to UI
    const userMessage: ChatMessage = {
      id: Date.now(),
      session_id: parseInt(sessionId),
      message_type: 'user',
      content: inputMessage,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    // Send via WebSocket
    sendMessage(inputMessage);
    setInputMessage('');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>AI Assistant</h3>
        <div className={`connection-status ${connectionStatus}`}>
          {connectionStatus}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.message_type}`}
          >
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-time">
              {new Date(message.created_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask about your data..."
          disabled={connectionStatus !== 'connected'}
        />
        <button
          onClick={handleSendMessage}
          disabled={connectionStatus !== 'connected' || !inputMessage.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};
```

## Best Practices

### 1. Token Management
- Store JWT tokens securely (consider httpOnly cookies for production)
- Implement automatic token refresh
- Handle token expiration gracefully
- Clear tokens on logout

### 2. Error Handling
- Implement centralized error handling
- Show user-friendly error messages
- Log errors for debugging
- Handle network failures gracefully

### 3. Performance
- Implement request caching where appropriate
- Use pagination for large data sets
- Debounce search inputs
- Optimize WebSocket message handling

### 4. Security
- Validate all user inputs
- Sanitize data before display
- Use HTTPS in production
- Implement proper CORS configuration

### 5. User Experience
- Show loading states during API calls
- Implement optimistic updates where possible
- Provide clear feedback for user actions
- Handle offline scenarios

### 6. WebSocket Best Practices
- Implement reconnection logic
- Handle connection state properly
- Clean up WebSocket connections on component unmount
- Consider fallback to REST API if WebSocket fails

## Environment Configuration

```javascript
// config/api.js
const config = {
  development: {
    apiUrl: 'http://localhost:8080/api',
    wsUrl: 'ws://localhost:8080/ws'
  },
  production: {
    apiUrl: 'https://api.flexybi.com/api',
    wsUrl: 'wss://api.flexybi.com/ws'
  }
};

export const API_CONFIG = config[process.env.NODE_ENV || 'development'];
```

## Sample CSS Styles

```css
/* Chat Component Styles */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.connection-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.connection-status.connected {
  background-color: #d4edda;
  color: #155724;
}

.connection-status.disconnected {
  background-color: #f8d7da;
  color: #721c24;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  max-width: 80%;
}

.message.user {
  background-color: #007bff;
  color: white;
  margin-left: auto;
}

.message.assistant {
  background-color: #f8f9fa;
  color: #333;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 0.25rem;
}

.chat-input {
  display: flex;
  padding: 1rem;
  border-top: 1px solid #ddd;
  background-color: #f5f5f5;
}

.chat-input input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 0.5rem;
}

.chat-input button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chat-input button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

/* File Upload Styles */
.file-upload {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: border-color 0.3s ease;
}

.file-upload.dragging {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
}

.upload-prompt input[type="file"] {
  margin-top: 1rem;
}
```

This comprehensive frontend integration guide provides everything needed to build a modern, responsive frontend for the Flexy BI backend. It includes authentication, file management, real-time chat, error handling, TypeScript definitions, React components, and styling examples.
