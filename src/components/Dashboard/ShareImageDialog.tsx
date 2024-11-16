import React, { useState } from 'react';
import { StoredImage } from '../../types';

interface ShareImageDialogProps {
  image: StoredImage;
  isOpen: boolean;
  onClose: () => void;
  onShare: (image: StoredImage, recipientAddress: string) => Promise<void>;
}

const ShareImageDialog: React.FC<ShareImageDialogProps> = ({ 
  image, 
  isOpen, 
  onClose,
  onShare 
}) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientAddress) return;

    setIsSharing(true);
    setError(null);

    try {
      await onShare(image, recipientAddress);
      onClose();
    } catch (err) {
      console.error('Failed to share image:', err);
      setError('Failed to share image. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Share Image</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleShare}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Ethereum Address
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="0x..."
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isSharing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSharing || !recipientAddress}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isSharing ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShareImageDialog;