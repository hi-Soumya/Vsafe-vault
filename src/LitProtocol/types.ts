import { LitNodeClient } from "@lit-protocol/lit-node-client";

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

export interface SharedImageMetadata {
  cid: string;
  url: string;
  encryptedSymmetricKey: string;
  owner: string;
  sharedWith: string[];
  isRevoked: boolean;
  timestamp: number;
}

export interface LitClientInstance {
  litNodeClient: LitNodeClient | null;
}

// New types for our specific use case
export interface ImageAccessConditions {
  contractAddress: string;
  chain: string;
  method: string;
  parameters: string[];
  returnValueTest: {
    comparator: string;
    value: string;
  };
}