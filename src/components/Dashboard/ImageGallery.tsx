import React, { useState } from 'react';
import ShareImageDialog from './ShareImageDialog';
import { contractService } from '../../services/ContractService';
import { useStoracha } from '../../components/StorachaProvider';
import { StoredImage } from '../../types';

interface Props {
  images: StoredImage[];
  isAdmin: boolean;
}

const ImageGallery: React.FC<Props> = ({ images, isAdmin }) => {
  const [selectedImage, setSelectedImage] = useState<StoredImage | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const { revokeAccess, shareImage } = useStoracha();

  const handleRevoke = async (image: StoredImage, recipientAddress: string) => {
    if (!image.cid || !recipientAddress) return;

    try {
      setIsRevoking(image.cid);
      await contractService.revokeAccess(image.cid, recipientAddress);
      await revokeAccess(image, recipientAddress);
    } catch (error) {
      console.error('Failed to revoke access:', error);
      alert('Failed to revoke access. Please try again.');
    } finally {
      setIsRevoking(null);
    }
  };

  const handleRestoreAccess = async (image: StoredImage, recipientAddress: string) => {
    if (!image.cid || !recipientAddress) return;

    try {
      setIsRevoking(image.cid);
      await contractService.restoreAccess(image.cid, recipientAddress);
      await revokeAccess(image, recipientAddress);
    } catch (error) {
      console.error('Failed to restore access:', error);
      alert('Failed to restore access. Please try again.');
    } finally {
      setIsRevoking(null);
    }
  };

  const handleShare = async (image: StoredImage, recipientAddress: string) => {
    try {
      await shareImage(image, recipientAddress);
    } catch (error) {
      console.error('Failed to share image:', error);
      alert('Failed to share image. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {isAdmin ? 'Your Images' : 'Shared Images'}
      </h2>
      
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
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 rounded-lg">
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 space-x-2">
                <button
                  onClick={() => window.open(image.url, '_blank')}
                  className="bg-white text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  View
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedImage(image);
                        setIsShareDialogOpen(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Share
                    </button>
                    {image.sharedWith && image.sharedWith.length > 0 && (
                      <button
                        onClick={() => 
                          image.isRevoked 
                            ? handleRestoreAccess(image, image.sharedWith![0])
                            : handleRevoke(image, image.sharedWith![0])
                        }
                        disabled={isRevoking === image.cid}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          isRevoking === image.cid
                            ? 'bg-gray-400'
                            : image.isRevoked
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        } text-white`}
                      >
                        {isRevoking === image.cid
                          ? 'Processing...'
                          : image.isRevoked
                          ? 'Restore Access'
                          : 'Revoke Access'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-500">{image.name}</p>
              {image.sharedWith && image.sharedWith.length > 0 && (
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">
                    Shared with {image.sharedWith.length} user(s)
                  </p>
                  {image.isRevoked && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Access Revoked
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <ShareImageDialog
          image={selectedImage}
          isOpen={isShareDialogOpen}
          onClose={() => {
            setSelectedImage(null);
            setIsShareDialogOpen(false);
          }}
          onShare={handleShare}
        />
      )}
    </div>
  );
};

export default ImageGallery;