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

export interface EncryptionResult {
  encryptedFile: Blob;
  encryptedSymmetricKey: string;
}

export interface AccessControlConditions {
  contractAddress: string;
  standardContractType: string;
  chain: string;
  method: string;
  parameters: string[];
  returnValueTest: {
    comparator: string;
    value: string;
  };
}