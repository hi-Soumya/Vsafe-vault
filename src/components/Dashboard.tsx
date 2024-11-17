import React, { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface UploadedImage {
  cid: string;
  url: string;
  metadataUrl: string;
  timestamp: number;
  name: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const Dashboard: React.FC = () => {
  const { primaryWallet } = useDynamicContext();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);  // Added loading state

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !primaryWallet?.address) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',  // Added this line
        headers: {
          'Accept': 'application/json',  // Added this line
        }
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadProgress(100);

      const newImage: UploadedImage = {
        cid: result.cid,
        url: result.url,
        metadataUrl: result.metadataUrl,
        timestamp: Date.now(),
        name: selectedFile.name
      };

      setUploadedImages(prev => {
        const updated = [...prev, newImage];
        localStorage.setItem(
          `uploaded-images-${primaryWallet.address}`,
          JSON.stringify(updated)
        );
        return updated;
      });
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  // Initialize and load data
  React.useEffect(() => {
    const loadData = async () => {
      if (primaryWallet?.address) {
        try {
          // Load saved images from localStorage
          const savedImages = localStorage.getItem(`uploaded-images-${primaryWallet.address}`);
          if (savedImages) {
            setUploadedImages(JSON.parse(savedImages));
          }
        } catch (error) {
          console.error('Error loading saved images:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [primaryWallet?.address]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Upload New Image
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className={isLoading ? 'flex items-center justify-center p-6' : 'hidden'}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3"></div>
          <span className="text-gray-600">Loading...</span>
        </div>

        <form onSubmit={handleUpload} className={!isLoading ? 'block' : 'hidden'}>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full"
            />
          </div>

          {selectedFile && (
            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </button>
          )}

          {(isUploading || uploadProgress > 0) && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </form>
      </div>

      {/* Image Gallery */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Your Uploaded Images
        </h2>
        
        {uploadedImages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No images uploaded yet. Upload your first image above!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedImages.map((image) => (
              <div key={image.cid} className="relative group">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 rounded-lg">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 space-x-2">
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                    >
                      View Image
                    </a>
                    <a
                      href={image.metadataUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                    >
                      View Metadata
                    </a>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {image.name} - {new Date(image.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;