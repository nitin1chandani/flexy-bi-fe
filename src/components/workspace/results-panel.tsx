"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Download, Share2 } from "lucide-react";
import { Workspace } from "@/lib/types";

interface ResultsPanelProps {
  workspace?: Workspace | null;
}

export function ResultsPanel({ workspace }: ResultsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Insights Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Generated Insights</h3>
          <p className="text-sm text-gray-600">AI-powered analysis of your data</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Dynamic State Based on Workspace */}
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <div className="inline-flex p-3 bg-gray-100 rounded-full mb-4">
              <Plus className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Insights Yet
            </h3>
            {workspace?.files && workspace.files.length > 0 ? (
              <p className="text-gray-600 mb-6">
                Great! You have {workspace.files.length} file(s) uploaded. Start chatting with the AI to generate insights and visualizations from your data.
              </p>
            ) : (
              <p className="text-gray-600 mb-6">
                Upload your data files and start chatting with the AI to generate insights and visualizations.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

