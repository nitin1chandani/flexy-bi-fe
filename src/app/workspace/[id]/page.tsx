"use client";

import { useState, use, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatInterface } from "@/components/workspace/chat-interface";
import { ResultsPanel } from "@/components/workspace/results-panel";
import { ArrowLeft, Settings, Share2 } from "lucide-react";
import Link from "next/link";
import { workspacesAPI } from "@/lib/api";
import { Workspace } from "@/lib/types";

interface WorkspacePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [workspaceData, setWorkspaceData] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);

  // Fetch workspace data from API
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        const workspaceId = parseInt(resolvedParams.id);
        const workspace = await workspacesAPI.getWorkspace(workspaceId);
        setWorkspaceData(workspace);
      } catch (error) {
        console.error('Failed to fetch workspace:', error);
        setError('Failed to load workspace data');
        // Fallback to default data
        setWorkspaceData({
          id: parseInt(resolvedParams.id),
          name: `Workspace ${resolvedParams.id}`,
          description: '',
          files: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspaceData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load workspace</p>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="h-4 w-px bg-gray-300" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {workspaceData?.name || `Workspace ${resolvedParams.id}`}
              </h1>
              <p className="text-sm text-gray-500">
                {workspaceData?.files && workspaceData.files.length > 0
                  ? `${workspaceData.files.length} file(s) uploaded`
                  : "No file uploaded"} • Updated {workspaceData?.updated_at ? new Date(workspaceData.updated_at).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat Interface */}
        <div 
          className={`bg-white border-r border-gray-200 transition-all duration-300 ${
            isChatCollapsed ? 'w-12' : 'w-2/5'
          }`}
        >
          {isChatCollapsed ? (
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatCollapsed(false)}
                className="w-full"
              >
                <span className="sr-only">Expand chat</span>
                <span className="text-xs rotate-90">Chat</span>
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    AI Assistant
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChatCollapsed(true)}
                  >
                    <span className="sr-only">Collapse chat</span>
                    ←
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Ask questions about your data in natural language
                </p>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatInterface workspaceId={parseInt(resolvedParams.id)} />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Results */}
        <div className={`flex-1 bg-gray-50 overflow-hidden ${
          isChatCollapsed ? 'w-full' : 'w-3/5'
        }`}>
          <div className="h-full flex flex-col">
            <div className="p-4 bg-white border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Analysis Results
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Generated insights and visualizations from your queries
              </p>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <ResultsPanel workspace={workspaceData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}