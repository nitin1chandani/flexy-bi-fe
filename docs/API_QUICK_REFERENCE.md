# API Quick Reference

Quick reference guide for the Flexy BI Backend API endpoints.

## Base URL
- **Development**: `http://localhost:8080/api`
- **Production**: `https://your-domain.com/api`

## Authentication

All protected endpoints require the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | User registration | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/refresh` | Refresh JWT token | Yes |
| GET | `/auth/profile` | Get user profile | Yes |

### File Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/files/upload` | Upload Excel/CSV file | Yes |
| GET | `/files` | List user's files | Yes |
| GET | `/files/:id/preview` | Get file preview with metadata | Yes |
| GET | `/files/:id/status` | Get file processing status | Yes |
| DELETE | `/files/:id` | Delete file | Yes |

### Workspace Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/workspaces` | Create workspace | Yes |
| GET | `/workspaces` | List user's workspaces | Yes |
| GET | `/workspaces/:id` | Get workspace details | Yes |
| PUT | `/workspaces/:id` | Update workspace | Yes |
| DELETE | `/workspaces/:id` | Delete workspace | Yes |

### Chat & AI
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/chat/sessions` | Create chat session | Yes |
| GET | `/chat/sessions/:session_id/messages` | Get chat messages | Yes |
| POST | `/chat/sessions/:session_id/messages` | Send message | Yes |

### WebSocket
| Endpoint | Description | Auth Required |
|----------|-------------|---------------|
| `ws://localhost:8080/ws/chat/:session_id` | Real-time chat | Yes |

### Insights
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/insights` | List insights | Yes |
| POST | `/insights/generate` | Generate new insight | Yes |
| GET | `/insights/:id` | Get specific insight | Yes |
| POST | `/insights/:id/export` | Export insight | Yes |

### Dashboards
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboards` | List dashboards | Yes |
| POST | `/dashboards` | Create dashboard | Yes |
| GET | `/dashboards/:id` | Get dashboard | Yes |
| PUT | `/dashboards/:id` | Update dashboard | Yes |
| DELETE | `/dashboards/:id` | Delete dashboard | Yes |
| POST | `/dashboards/:id/widgets` | Add widget | Yes |
| PUT | `/dashboards/:id/widgets/:widget_id` | Update widget | Yes |
| DELETE | `/dashboards/:id/widgets/:widget_id` | Remove widget | Yes |
| POST | `/dashboards/:id/export` | Export dashboard | Yes |

## Request/Response Examples

### User Registration
```javascript
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}

Response:
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "subscription_plan": "free",
    "api_usage_count": 0
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### File Upload
```javascript
POST /api/files/upload
Content-Type: multipart/form-data

FormData:
- file: [Excel/CSV file]
- name: "Q1 Sales Data" (optional)

Response:
{
  "id": 1,
  "filename": "1234567890_sales.xlsx",
  "original_filename": "Q1 Sales Data",
  "file_type": "xlsx",
  "file_size": 1024000,
  "status": "processing",
  "created_at": "2023-01-15T10:30:00Z"
}
```

### Create Workspace
```javascript
POST /api/workspaces
{
  "name": "Q1 Analysis",
  "description": "First quarter sales analysis",
  "file_ids": [1, 2, 3]
}

Response:
{
  "id": 1,
  "name": "Q1 Analysis",
  "description": "First quarter sales analysis",
  "files": [...],
  "created_at": "2023-01-15T10:30:00Z",
  "updated_at": "2023-01-15T10:30:00Z"
}
```

### Send Chat Message
```javascript
POST /api/chat/sessions/abc-123-def/messages
{
  "content": "Show me revenue trends for Q1"
}

Response:
{
  "id": 1,
  "session_id": 1,
  "message_type": "assistant",
  "content": "I've analyzed your Q1 revenue data...",
  "created_at": "2023-01-15T10:30:00Z"
}
```

### WebSocket Message Format
```javascript
// Send message
{
  "type": "user_message",
  "content": "Show me revenue by region"
}

// Receive response
{
  "type": "ai_response",
  "content": "Here's the revenue breakdown by region...",
  "data": {
    "insight_id": 123,
    "chart_config": {...},
    "chart_data": {...}
  }
}
```

### Generate Insight
```javascript
POST /api/insights/generate
{
  "workspace_id": 1,
  "query": "Show revenue trends over time",
  "insight_type": "line_chart"
}

Response:
{
  "id": 1,
  "workspace_id": 1,
  "insight_type": "line_chart",
  "title": "Revenue Trends Analysis",
  "description": "Monthly revenue trends for the selected period",
  "chart_config": {
    "type": "line_chart",
    "options": {...}
  },
  "data": {
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [...]
  },
  "sql_query": "SELECT month, SUM(revenue) FROM sales GROUP BY month",
  "created_at": "2023-01-15T10:30:00Z"
}
```

## Error Responses

All error responses follow this format:
```javascript
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## File Upload Limits
- **Maximum file size**: 50MB
- **Supported formats**: .xlsx, .csv
- **Processing time**: Varies based on file size (typically 10-60 seconds)

## Rate Limits
- **API requests**: 1000 requests per hour per user
- **File uploads**: 10 files per hour per user
- **WebSocket connections**: 5 concurrent connections per user

## Environment Variables for Frontend
```javascript
// Development
const API_BASE_URL = 'http://localhost:8080/api';
const WS_BASE_URL = 'ws://localhost:8080/ws';

// Production
const API_BASE_URL = 'https://api.flexybi.com/api';
const WS_BASE_URL = 'wss://api.flexybi.com/ws';
```
