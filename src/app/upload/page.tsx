"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { DataPreview } from "@/components/upload/data-preview";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { filesAPI, workspacesAPI, authAPI, APIError } from "@/lib/api";
import { UploadedFile } from "@/lib/types";

type UploadStep = 'upload' | 'preview' | 'uploading';

export default function UploadPage() {
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    
    setSelectedFiles(files);
    setCurrentStep('uploading');
    setError("");
    
    try {
      // Upload the first file
      const file = files[0];
      const result = await filesAPI.uploadFile(file);
      
      // Poll for completion
      filesAPI.pollFileStatus(
        result.id,
        (progress) => setUploadProgress(progress),
        (completedFile) => {
          setUploadedFile(completedFile);
          setCurrentStep('preview');
        },
        (errorMsg) => {
          setError(errorMsg);
          setCurrentStep('upload');
        }
      );
      
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError("Upload failed. Please try again.");
      }
      setCurrentStep('upload');
    }
  };

  const handlePreviewFiles = () => {
    if (selectedFiles.length > 0) {
      setCurrentStep('preview');
    }
  };

  const handleContinueToWorkspace = async () => {
    if (!uploadedFile) return;
    
    try {
      // Create a workspace with the uploaded file
      const workspace = await workspacesAPI.createWorkspace({
        name: `Analysis - ${uploadedFile.original_filename}`,
        description: `Workspace for analyzing ${uploadedFile.original_filename}`,
        file_ids: [uploadedFile.id]
      });
      
      router.push(`/workspace/${workspace.id}`);
    } catch (err) {
      console.error('Failed to create workspace:', err);
      // Fallback: navigate to workspace without creating one
      router.push(`/workspace/file-${uploadedFile.id}`);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Upload Your Data Files
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload Excel or CSV files containing your business data. Our AI will analyze 
                the structure and help you generate insights through natural language queries.
              </p>
            </div>

            {error && (
              <div className="max-w-4xl mx-auto">
                <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              </div>
            )}

            <div className="max-w-4xl mx-auto">
              <FileDropzone 
                onFilesSelected={handleFilesSelected}
                maxFiles={1}
                acceptedTypes={['.xlsx', '.xls', '.csv']}
              />
            </div>
          </div>
        );

      case 'uploading':
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Processing Your File
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We're analyzing your data structure and preparing it for AI insights.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                </div>
                <p className="text-lg font-medium">Processing... {uploadProgress}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                {selectedFiles.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Analyzing: {selectedFiles[0].name}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'preview':
        return uploadedFile ? (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                File Processed Successfully!
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Your file has been analyzed and is ready for AI-powered insights.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4">File Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">File Name</p>
                  <p className="text-gray-600">{uploadedFile.original_filename}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">File Type</p>
                  <p className="text-gray-600">{uploadedFile.file_type.toUpperCase()}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">File Size</p>
                  <p className="text-gray-600">{(uploadedFile.file_size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Status</p>
                  <p className="text-green-600 capitalize">{uploadedFile.status}</p>
                </div>
              </div>
              
              {uploadedFile.metadata && (
                <div className="mt-4 pt-4 border-t">
                  <p className="font-medium text-gray-700 mb-2">Data Preview</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Rows: {uploadedFile.metadata.row_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Columns: {uploadedFile.metadata.columns.length}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-gray-600 text-xs">
                      Columns: {uploadedFile.metadata.columns.join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <Button size="lg" onClick={handleContinueToWorkspace}>
                Continue to AI Workspace
              </Button>
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header with back button */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          className="mb-4"
        >
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Step indicator */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <span className={`text-sm font-medium ${
              currentStep === 'upload' ? 'text-blue-600' : 'text-gray-500'
            }`}>
              Upload Files
            </span>
          </div>
          
          <div className={`h-0.5 w-12 ${
            currentStep === 'preview' ? 'bg-blue-600' : 'bg-gray-200'
          }`} />
          
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <span className={`text-sm font-medium ${
              currentStep === 'preview' ? 'text-blue-600' : 'text-gray-500'
            }`}>
              Preview Data
            </span>
          </div>
        </div>
      </div>

      {/* Step content */}
      {renderStep()}
    </div>
  );
}