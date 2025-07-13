// Authentication API services
import { apiClient } from '../api-client';
import { AuthResponse, User } from '../types';

export const authAPI = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
    });
    
    // Store token and user in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    
    // Store token and user in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  async refreshToken(): Promise<{ token: string }> {
    const response = await apiClient.post('/auth/refresh');
    
    // Update token in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  },

  async getProfile(): Promise<User> {
    return await apiClient.get('/auth/profile');
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) return token;

      // For development: provide a fallback token if none exists
      if (process.env.NODE_ENV === 'development') {
        const fallbackToken = 'dev-token-' + Date.now();
        localStorage.setItem('auth_token', fallbackToken);
        return fallbackToken;
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};