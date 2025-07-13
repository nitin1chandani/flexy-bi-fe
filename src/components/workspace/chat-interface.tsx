"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";
import { useChatWebSocket } from "@/hooks/use-chat-websocket";
import { chatAPI } from "@/lib/api";
import { ChatMessage, WebSocketMessage } from "@/lib/types";
import { ChartMessage } from "@/components/chat/chart-message";
import { MultiChartMessage } from "@/components/chat/multi-chart-message";

interface ChatInterfaceProps {
  sessionId?: string;
  workspaceId?: number;
}

export function ChatInterface({ sessionId, workspaceId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  const [isInitializing, setIsInitializing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat session if needed
  useEffect(() => {
    const initializeSession = async () => {
      console.log('🔧 Initializing session...', { currentSessionId, workspaceId });
      if (!currentSessionId && workspaceId) {
        setIsInitializing(true);
        try {
          console.log('📡 Creating chat session for workspace:', workspaceId);
          const session = await chatAPI.createChatSession(workspaceId);
          console.log('✅ Chat session created:', session.session_id);
          setCurrentSessionId(session.session_id);
        } catch (error) {
          console.error('❌ Failed to create chat session:', error);
          const fallbackSessionId = `fallback-${workspaceId}-${Date.now()}`;
          console.log('🔄 Using fallback session ID:', fallbackSessionId);
          setCurrentSessionId(fallbackSessionId);
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initializeSession();
  }, [currentSessionId, workspaceId]);

  // Load existing messages when session is available
  useEffect(() => {
    const loadExistingMessages = async () => {
      if (!currentSessionId || currentSessionId.startsWith('fallback-')) {
        console.log('⏸️ Skipping message loading - no valid session ID');
        return;
      }

      try {
        console.log('📥 Loading existing messages for session:', currentSessionId);
        const response = await chatAPI.getChatMessages(currentSessionId);
        const existingMessages = response.messages || [];

        console.log('✅ Loaded', existingMessages.length, 'existing messages');
        setMessages(existingMessages);
      } catch (error) {
        console.error('❌ Failed to load existing messages:', error);
        console.log('🔄 Backend not available - starting with empty chat');
        // Don't show error to user, just start with empty messages
        // This allows the app to work without backend
      }
    };

    loadExistingMessages();
  }, [currentSessionId]);

  // WebSocket connection
  const { connectionStatus, sendMessage: sendWSMessage } = useChatWebSocket({
    sessionId: currentSessionId || '',
    onMessage: (wsMessage: WebSocketMessage) => {
      console.log('🔌 WebSocket message received:', wsMessage);
      if (wsMessage.type === 'ai_response') {
        console.log('🤖 Processing AI response:', wsMessage.content);
        
        // Try to parse chart data from the response
        let chartData = null;
        let content = wsMessage.content;

        try {
          // Check metadata first
          if (wsMessage.data?.chart_config) {
            chartData = wsMessage.data.chart_config;
            console.log('📊 Chart data found in metadata:', chartData);
          } else {
            // Try to extract chart data from content
            const chartMatch = content.match(/\{[^{}]*"chart_config"[^{}]*\{.*?\}.*?\}/s) ||
                              content.match(/\{[^{}]*"type":\s*"(pie|bar|line|scatter|doughnut)".*?\}/s);

            if (chartMatch) {
              try {
                const parsed = JSON.parse(chartMatch[0]);
                if (parsed.chart_config) {
                  chartData = parsed.chart_config;
                } else if (parsed.type) {
                  chartData = parsed;
                }
                console.log('📊 Chart data extracted from content:', chartData);
              } catch (parseError) {
                console.log('⚠️ Failed to parse extracted chart JSON:', parseError);
              }
            }
          }
        } catch (error) {
          console.log('⚠️ Failed to parse chart data:', error);
        }
        
        const aiMessage: ChatMessage = {
          id: Date.now(),
          session_id: parseInt(currentSessionId || '0'),
          message_type: 'assistant',
          content: content,
          metadata: wsMessage.data,
          chart_data: chartData,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !currentSessionId) return;

    console.log('🚀 Sending message:', { content: content.trim(), currentSessionId, connectionStatus });

    const userMessage: ChatMessage = {
      id: Date.now(),
      session_id: parseInt(currentSessionId),
      message_type: 'user',
      content: content.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Send via WebSocket if connected
    if (connectionStatus === 'connected') {
      console.log('🔌 Sending message via WebSocket:', content.trim());
      sendWSMessage(content.trim());
    } else {
      console.log('🌐 WebSocket not connected, using mock response. Status:', connectionStatus);
      
      // Mock AI response for demo
      setTimeout(() => {
        const mockResponse: ChatMessage = {
          id: Date.now() + 1,
          session_id: parseInt(currentSessionId),
          message_type: 'assistant',
          content: "I'm a mock AI response. WebSocket connection is not available, but I can still help you! Try asking for charts or data analysis.",
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, mockResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Initializing chat session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.message_type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.message_type === 'assistant' && (
                <div className="flex items-center space-x-1 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">AI Assistant</span>
                </div>
              )}
              
              {/* Render chart if chart_data exists, or check for multiple charts in content */}
              {message.chart_data ? (
                <ChartMessage 
                  chartData={message.chart_data} 
                  message={message.content}
                />
              ) : message.content.includes('"chart_config"') ||
                  message.content.includes('"response_type": "chart"') ||
                  message.content.includes('"type": "pie"') ||
                  message.content.includes('"type": "bar"') ||
                  message.content.includes('"type": "line"') ||
                  message.content.includes('"type": "scatter"') ||
                  message.content.includes('"type": "doughnut"') ? (
                <MultiChartMessage content={message.content} />
              ) : (
                <p className="text-sm leading-relaxed">{message.content}</p>
              )}
              
              {message.metadata?.insight_id && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                  ✨ Generated insight #{message.metadata.insight_id} - Check the results panel!
                </div>
              )}
              <p className="text-xs opacity-70 mt-2">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {connectionStatus === 'connecting' && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-1 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">AI Assistant</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your data..."
            disabled={!currentSessionId || connectionStatus === 'connecting'}
            className="flex-1"
          />
          <Button
            onClick={() => {
              console.log('🖱️ Send button clicked!', { inputValue, currentSessionId, connectionStatus });
              handleSendMessage(inputValue);
            }}
            disabled={!inputValue.trim() || !currentSessionId || connectionStatus === 'connecting'}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Upload your data files first, then ask questions about your business data.
          </p>
          {connectionStatus === 'connected' && (
            <span className="text-xs text-green-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Live connection
            </span>
          )}
          {connectionStatus === 'connecting' && (
            <span className="text-xs text-yellow-600 flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></span>
              Connecting...
            </span>
          )}
          {connectionStatus === 'disconnected' && (
            <span className="text-xs text-gray-500 flex items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
              Backend required
            </span>
          )}
          {connectionStatus === 'error' && (
            <span className="text-xs text-red-500 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
              Connection failed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
