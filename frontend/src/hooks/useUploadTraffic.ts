import { useState } from 'react';
import { uploadTrafficFile } from '../api/client';
import { AnalyzeFileResponse } from '../types/prediction';

export function useUploadTraffic() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeFileResponse | null>(null);

  const uploadFile = async (file: File): Promise<AnalyzeFileResponse | null> => {
    setIsUploading(true);
    setError(null);
    try {
      const data = await uploadTrafficFile(file);
      setResult(data);
      return data;
    } catch (err: any) {
      const msg = err.message || 'Upload failed';
      setError(msg);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    isUploading,
    error,
    result,
  };
}
