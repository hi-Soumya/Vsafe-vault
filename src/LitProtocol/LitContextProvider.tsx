import React, { createContext, useContext, ReactNode } from 'react';
import { LitEncryption } from './encryption';
import { LitDecryption } from './decryption';
import { EncryptionResult } from './types';

interface LitContextType {
  encryptFileForUser: (
    file: File,
    contractAddress: string,
    userAddress: string
  ) => Promise<EncryptionResult>;
  decryptSharedFile: (
    encryptedFile: Blob,
    encryptedSymmetricKey: string,
    contractAddress: string
  ) => Promise<Blob>;
}

const LitContext = createContext<LitContextType | null>(null);

export const useLit = () => {
  const context = useContext(LitContext);
  if (!context) {
    throw new Error('useLit must be used within a LitProvider');
  }
  return context;
};

interface LitProviderProps {
  children: ReactNode;
}

export const LitProvider: React.FC<LitProviderProps> = ({ children }) => {
  React.useEffect(() => {
    // Initialize Lit client when provider mounts
    const init = async () => {
      await LitEncryption.connectClient();
      await LitDecryption.connectClient();
    };
    init();

    // Cleanup on unmount
    return () => {
      LitEncryption.disconnect();
      LitDecryption.disconnect();
    };
  }, []);

  const value = {
    encryptFileForUser: LitEncryption.encryptFileForUser.bind(LitEncryption),
    decryptSharedFile: LitDecryption.decryptSharedFile.bind(LitDecryption),
  };

  return <LitContext.Provider value={value}>{children}</LitContext.Provider>;
};