"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, FileText, Eye } from "lucide-react";

interface DataPreviewProps {
  file: File;
  onContinue: () => void;
}

// Function to parse file preview
const parseFilePreview = (file: File) => {
  // This would normally parse the actual file
  // For now, return empty structure since no backend is available
  return {
    headers: [],
    rows: [],
    totalRows: 0,
    totalColumns: 0
  };
};

export function DataPreview({ file, onContinue }: DataPreviewProps) {
  const [previewData] = useState(() => parseFilePreview(file));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Preview</h2>
          <p className="text-gray-600 mt-1">
            Review your data structure before proceeding to analysis
          </p>
        </div>
        <Button onClick={onContinue} size="lg">
          Continue to Workspace
        </Button>
      </div>

      {/* File Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>File Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">File Name</p>
              <p className="text-gray-600">{file.name}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Size</p>
              <p className="text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Rows</p>
              <p className="text-gray-600">{previewData.totalRows.toLocaleString()}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Columns</p>
              <p className="text-gray-600">{previewData.totalColumns}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Preview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Data Preview (First 5 rows)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {previewData.headers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {previewData.headers.map((header, index) => (
                        <th
                          key={index}
                          className="text-left p-3 font-medium text-gray-700 bg-gray-50"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-100 hover:bg-gray-50">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="p-3 text-gray-600">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {previewData.totalRows > 5 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  Showing 5 of {previewData.totalRows.toLocaleString()} rows
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex p-3 bg-gray-100 rounded-full mb-4">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                File Preview Not Available
              </h3>
              <p className="text-gray-600">
                File parsing requires backend services. The file will be processed when you continue.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Column Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Table className="w-5 h-5" />
            <span>Column Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {previewData.headers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {previewData.headers.map((header, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{header}</h4>
                    <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                      Unknown
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Column analysis requires backend processing
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">
                Column analysis will be available after file processing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}