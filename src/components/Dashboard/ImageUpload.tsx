import React, { useState } from 'react';
import { StoredImage } from '../../types';

export interface ImageUploadProps {
  onUpload: (file: File) => Promise<StoredImage>;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Upload New Image
      </h2>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        {previewUrl && (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="mt-4 max-h-48 object-contain"
          />
        )}
        {selectedFile && (
          <button
            type="submit"
            disabled={isUploading}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        )}
      </form>
    </div>
  );
};

export default ImageUpload;