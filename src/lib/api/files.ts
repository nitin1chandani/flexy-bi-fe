// File management API services
import { apiClient } from '../api-client';
import { UploadedFile, FileMetadata } from '../types';

export const filesAPI = {
  async uploadFile(file: File, name?: string): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (name) {
      formData.append('name', name);
    }

    return await apiClient.post('/files/upload', formData);
  },

  async getFiles(): Promise<{ files: UploadedFile[] }> {
    return await apiClient.get('/files');
  },

  async getFilePreview(fileId: number): Promise<FileMetadata> {
    return await apiClient.get(`/files/${fileId}/preview`);
  },

  async getFileStatus(fileId: number): Promise<{
    id: number;
    status: 'processing' | 'completed' | 'failed';
    progress: number;
    error_message?: string;
  }> {
    return await apiClient.get(`/files/${fileId}/status`);
  },

  async deleteFile(fileId: number): Promise<{ message: string }> {
    return await apiClient.delete(`/files/${fileId}`);
  },

  // Helper function to poll file status until completion
  async pollFileStatus(
    fileId: number,
    onProgress: (progress: number) => void,
    onComplete: (file: UploadedFile) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const pollInterval = setInterval(async () => {
      try {
        const status = await this.getFileStatus(fileId);
        onProgress(status.progress);

        if (status.status === 'completed') {
          clearInterval(pollInterval);
          // Get the full file data
          const filesResponse = await this.getFiles();
          const completedFile = filesResponse.files.find(f => f.id === fileId);
          if (completedFile) {
            onComplete(completedFile);
          }
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          onError(status.error_message || 'File processing failed');
        }
      } catch (error) {
        clearInterval(pollInterval);
        onError(error instanceof Error ? error.message : 'Unknown error');
      }
    }, 1000);

    // Set a timeout to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
      onError('File processing timeout');
    }, 300000); // 5 minutes timeout
  },
};