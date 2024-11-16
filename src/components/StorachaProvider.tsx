import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { StoredImage } from '../types';
import { storachaService } from '../services/StorachaService';
import { contractService } from '../services/ContractService';
import { useLit } from '../LitProtocol/LitContextProvider';

interface StorachaContextType {
  personalImages: StoredImage[];
  sharedImages: StoredImage[];
  uploadImage: (file: File) => Promise<void>;
  shareImage: (image: StoredImage, recipientAddress: string) => Promise<void>;
  revokeAccess: (image: StoredImage, recipientAddress: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const StorachaContext = createContext<StorachaContextType | null>(null);

export const useStoracha = () => {
  const context = useContext(StorachaContext);
  if (!context) {
    throw new Error('useStoracha must be used within a StorachaProvider');
  }
  return context;
};

export const StorachaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, primaryWallet } = useDynamicContext();
  const { encryptFileForUser } = useLit(); // Removed unused decryptSharedFile
  const [personalImages, setPersonalImages] = useState<StoredImage[]>([]);
  const [sharedImages, setSharedImages] = useState<StoredImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadImages = async () => {
    if (user?.email) {
      const [personal, shared] = await Promise.all([
        storachaService.getPersonalImages(user.email),
        storachaService.getSharedImages(user.email)
      ]);
      setPersonalImages(personal);
      setSharedImages(shared);
    }
  };

  useEffect(() => {
    const initializeServices = async () => {
      if (primaryWallet?.address) {
        try {
          setError(null);
          await Promise.all([
            storachaService.ensureInitialized(),
            contractService.initialize()
          ]);
          await loadImages();
        } catch (error) {
          console.error('Failed to initialize services:', error);
          setError('Failed to initialize storage service. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeServices();
  }, [primaryWallet?.address, user?.email]);

  const uploadImage = async (file: File) => {
    if (!user?.email || !primaryWallet?.address) return;

    try {
      // 1. Encrypt file using Lit Protocol
      const encryptionResult = await encryptFileForUser(
        file,
        contractService.contractAddress,
        primaryWallet.address
      );

      // 2. Create a new file with encrypted content
      const encryptedFile = new File(
        [encryptionResult.encryptedFile],
        file.name,
        { type: file.type }
      );

      // 3. Upload encrypted file to Storacha
      const uploadedImage = await storachaService.uploadFile(encryptedFile, user.email);

      // 4. Store the encryption key with the image metadata
      const finalImage = {
        ...uploadedImage,
        encryptedSymmetricKey: encryptionResult.encryptedSymmetricKey
      };

      setPersonalImages(prev => [...prev, finalImage]);
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  };

  const shareImage = async (image: StoredImage, recipientAddress: string) => {
    if (!user?.email || !primaryWallet?.address) return;

    try {
      // 1. Share image using smart contract
      await contractService.shareImage(image.cid, recipientAddress);

      // 2. Update sharing status in Storacha
      await storachaService.shareImage(image.cid, user.email, recipientAddress);

      // 3. Refresh images
      await loadImages();
    } catch (error) {
      console.error('Failed to share image:', error);
      throw error;
    }
  };

  const revokeAccess = async (image: StoredImage, recipientAddress: string) => {
    if (!user?.email || !primaryWallet?.address) return;

    try {
      // 1. Revoke access using smart contract
      await contractService.revokeAccess(image.cid, recipientAddress);

      // 2. Update sharing status in Storacha
      await storachaService.revokeAccess(image.cid, user.email, recipientAddress);

      // 3. Refresh images
      await loadImages();
    } catch (error) {
      console.error('Failed to revoke access:', error);
      throw error;
    }
  };

  const value = {
    personalImages,
    sharedImages,
    uploadImage,
    shareImage,
    revokeAccess,
    isLoading,
    error
  };

  return (
    <StorachaContext.Provider value={value}>
      {children}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
    </StorachaContext.Provider>
  );
};