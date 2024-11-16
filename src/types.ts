export interface StoredImage {
    cid: string;
    url: string;
    metadataUrl: string;
    name: string;
    timestamp: number;
    owner: string;
    encryptedSymmetricKey?: string;
    isRevoked?: boolean;
    sharedWith?: string[];
  }
  
  export interface ConnectedUser {
    email: string;
    status: 'pending' | 'connected';
  }