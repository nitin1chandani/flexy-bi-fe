"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_BASE_URL } from '@/lib/api-client';
import { authAPI } from '@/lib/api';
import { WebSocketMessage, ChatMessage } from '@/lib/types';

export interface UseChatWebSocketProps {
  sessionId: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export interface UseChatWebSocketReturn {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (content: string) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export const useChatWebSocket = ({
  sessionId,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: UseChatWebSocketProps): UseChatWebSocketReturn => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const connectionStartTime = useRef(0);
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    const authToken = authAPI.getToken();
    console.log('🔌 WebSocket connect() called with:', {
      sessionId,
      hasAuth: authAPI.isAuthenticated(),
      authToken: authToken ? 'present' : 'missing',
      WS_BASE_URL,
      isConnecting: isConnectingRef.current,
      currentState: wsRef.current?.readyState
    });

    if (!sessionId || sessionId.trim() === '') {
      console.log('❌ WebSocket connection skipped: missing sessionId');
      setConnectionStatus('disconnected');
      return;
    }

    if (!authAPI.isAuthenticated()) {
      console.log('❌ WebSocket connection skipped: not authenticated');
      setConnectionStatus('disconnected');
      return;
    }

    // Skip WebSocket connection if no backend is configured
    if (!WS_BASE_URL || WS_BASE_URL.trim() === '') {
      console.log('❌ WebSocket connection skipped: no backend server configured');
      setConnectionStatus('disconnected');
      return;
    }

    // Prevent duplicate connections
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.CONNECTING || wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⏸️ WebSocket connection skipped: already connecting or connected');
      return;
    }

    const token = authAPI.getToken();
    const wsUrl = `${WS_BASE_URL}/chat/${sessionId}?token=${token}`;

    setConnectionStatus('connecting');
    connectionStartTime.current = Date.now();
    isConnectingRef.current = true;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected - readyState:', ws.readyState);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        isConnectingRef.current = false;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('❌ WebSocket disconnected:', event.code, event.reason, 'readyState was:', ws.readyState);
        setConnectionStatus('disconnected');
        wsRef.current = null;
        isConnectingRef.current = false;
        onDisconnect?.();

        // Don't reconnect if:
        // - It was a normal closure (1000)
        // - We've exceeded max attempts
        // - The connection was immediately closed (likely server issue)
        const wasImmediateDisconnect = Date.now() - connectionStartTime.current < 5000; // Less than 5 seconds

        if (event.code === 1000 ||
            reconnectAttempts.current >= maxReconnectAttempts ||
            wasImmediateDisconnect) {
          console.log('WebSocket reconnection stopped:', {
            code: event.code,
            attempts: reconnectAttempts.current,
            immediate: wasImmediateDisconnect
          });
          return;
        }

        // Attempt to reconnect with exponential backoff
        const delay = Math.pow(2, reconnectAttempts.current) * 1000;
        console.log(`WebSocket reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      };

      ws.onerror = (error) => {
        console.log('WebSocket connection failed - backend server not available');
        setConnectionStatus('disconnected');
        isConnectingRef.current = false;
        onError?.(error);
      };

    } catch (error) {
      console.log('Failed to create WebSocket connection - backend server not available');
      setConnectionStatus('disconnected');
      isConnectingRef.current = false;
    }
  }, [sessionId, onMessage, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    // Reset reconnection attempts and connection state
    reconnectAttempts.current = 0;
    isConnectingRef.current = false;
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((content: string) => {
    // Capture values immediately to avoid closure issues
    const currentStatus = connectionStatus;
    const currentSessionId = sessionId;
    const currentWs = wsRef.current;
    const currentReadyState = currentWs?.readyState;

    const debugInfo = {
      content: content,
      connectionStatus: currentStatus,
      wsRef: !!currentWs,
      readyState: currentReadyState,
      WebSocketOPEN: WebSocket.OPEN,
      sessionId: currentSessionId
    };

    console.log('🔌 Attempting to send message:', debugInfo);

    if (currentWs && currentReadyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'user_message',
        content,
      };

      console.log('✅ Sending WebSocket message:', message);
      currentWs.send(JSON.stringify(message));
    } else {
      const errorInfo = {
        connectionStatus: currentStatus,
        wsExists: !!currentWs,
        readyState: currentReadyState,
        expectedState: WebSocket.OPEN,
        sessionId: currentSessionId,
        readyStateNames: {
          0: 'CONNECTING',
          1: 'OPEN',
          2: 'CLOSING',
          3: 'CLOSED'
        }
      };
      console.error('❌ WebSocket not ready:', errorInfo);

      // Try to reconnect if WebSocket is closed
      if (currentReadyState === WebSocket.CLOSED) {
        console.log('🔄 WebSocket is closed, attempting to reconnect...');
        connect();
      }
    }
  }, [connectionStatus, sessionId, connect]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // Connect when sessionId becomes available
  useEffect(() => {
    console.log('🔧 WebSocket useEffect triggered:', {
      sessionId,
      sessionIdType: typeof sessionId,
      sessionIdLength: sessionId?.length,
      shouldConnect: sessionId && sessionId.trim() !== '' && !sessionId.startsWith('fallback-'),
      connectionStatus,
      WS_BASE_URL
    });

    if (sessionId && sessionId.trim() !== '' && !sessionId.startsWith('fallback-')) {
      console.log('🚀 Calling connect() for session:', sessionId);
      setTimeout(() => connect(), 100); // Small delay to ensure everything is ready
    } else {
      console.log('🛑 Calling disconnect() - invalid session:', sessionId);
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      console.log('🧹 WebSocket useEffect cleanup');
      disconnect();
    };
  }, [sessionId]); // Remove connect/disconnect from dependencies to prevent re-renders

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    connectionStatus,
    sendMessage,
    disconnect,
    reconnect,
  };
};