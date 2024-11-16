import React, { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { storachaService, StoredImage, ConnectedUser } from '../services/StorachaService';

const Dashboard: React.FC = () => {
  const { user } = useDynamicContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [personalImages, setPersonalImages] = useState<StoredImage[]>([]);
  const [sharedImages, setSharedImages] = useState<StoredImage[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (!user?.email) return;

      try {
        // Check if user is admin
        const adminStatus = await storachaService.checkAdminStatus(user.email);
        setIsAdmin(adminStatus);

        if (adminStatus) {
          // Load admin's personal images
          const images = await storachaService.getPersonalImages(user.email);
          setPersonalImages(images);
          
          // Load connected users
          const users = await storachaService.getConnectedUsers(user.email);
          setConnectedUsers(users);
        } else {
          // Load shared images for non-admin users
          const shared = await storachaService.getSharedImages(user.email);
          setSharedImages(shared);
        }
      } catch (err) {
        console.error('Failed to initialize dashboard:', err);
        setError('Failed to load your images. Please try again.');
      }
    };

    initializeDashboard();
  }, [user?.email]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user?.email) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Upload file
      const result = await storachaService.uploadFile(selectedFile, user.email);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Update UI
      setPersonalImages(prev => [...prev, result]);
      
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const handleShare = async (image: StoredImage, recipientEmail: string) => {
    if (!user?.email) return;
    
    try {
      await storachaService.shareImage(image.cid, user.email, recipientEmail);
      setPersonalImages(prev =>
        prev.map(img =>
          img.cid === image.cid
            ? { ...img, sharedWith: [...(img.sharedWith || []), recipientEmail] }
            : img
        )
      );
    } catch (err) {
      setError('Failed to share image. Please try again.');
    }
  };

  const handleRevoke = async (image: StoredImage, recipientEmail: string) => {
    if (!user?.email) return;
    
    try {
      await storachaService.revokeAccess(image.cid, user.email, recipientEmail);
      setPersonalImages(prev =>
        prev.map(img =>
          img.cid === image.cid
            ? { ...img, isRevoked: true }
            : img
        )
      );
    } catch (err) {
      setError('Failed to revoke access. Please try again.');
    }
  };

  const handleConnectUser = async (email: string) => {
    if (!user?.email || !email) return;
    
    try {
      await storachaService.connectUser(user.email, email);
      setConnectedUsers(prev => [...prev, { email, status: 'pending' }]);
      setNewUserEmail('');
    } catch (err) {
      setError('Failed to connect with user. Please try again.');
    }
  };

  const renderUploadSection = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Upload New Image
      </h2>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-48 object-contain mb-4"
              />
            ) : (
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            )}
            <span className="mt-2 text-sm text-gray-500">
              {selectedFile ? selectedFile.name : 'Select an image to upload'}
            </span>
          </label>
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

        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </form>
    </div>
  );

  const renderConnectUserSection = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Connect with Users
      </h2>

      <div className="flex gap-4 mb-6">
        <input
          type="email"
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
          placeholder="Enter user email"
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={() => handleConnectUser(newUserEmail)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Connect
        </button>
      </div>

      <div className="mt-4">
        <h3 className="font-medium mb-2">Connected Users:</h3>
        {connectedUsers.map(user => (
          <div key={user.email} className="flex items-center justify-between py-2">
            <span>{user.email}</span>
            <span className={`px-2 py-1 rounded ${
              user.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {user.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderImageGallery = (images: StoredImage[], isPersonal: boolean) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image) => (
        <div key={image.cid} className="relative group">
          <img
            src={image.url}
            alt={image.name}
            className={`w-full h-48 object-cover rounded-lg ${
              image.isRevoked ? 'opacity-50' : ''
            }`}
          />
          {isPersonal && connectedUsers.length > 0 && (
            <div className="absolute top-2 right-2 space-y-2">
              {connectedUsers.map(user => (
                <button
                  key={user.email}
                  onClick={() => 
                    image.sharedWith?.includes(user.email)
                      ? handleRevoke(image, user.email)
                      : handleShare(image, user.email)
                  }
                  className={`px-3 py-1 rounded text-sm ${
                    image.sharedWith?.includes(user.email)
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {image.sharedWith?.includes(user.email) ? 'Revoke' : 'Share'}
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 text-sm text-gray-500">
            <p>{image.name}</p>
            <p>{new Date(image.timestamp).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {isAdmin ? (
        <>
          {renderConnectUserSection()}
          {renderUploadSection()}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Your Images
            </h2>
            {renderImageGallery(personalImages, true)}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Shared Images
          </h2>
          {renderImageGallery(sharedImages, false)}
        </div>
      )}
    </div>
  );
};

export default Dashboard;