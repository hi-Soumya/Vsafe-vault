import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { encryptFile } from "@lit-protocol/lit-node-client";
import { LitNetwork } from "@lit-protocol/constants";
import { EncryptionResult, AccessControlConditions } from './types';

export const LitEncryption = {
  litNodeClient: null as LitNodeClient | null,

  async connectClient(): Promise<void> {
    if (!this.litNodeClient) {
      this.litNodeClient = new LitNodeClient({
        litNetwork: LitNetwork.DatilDev
      });
      await this.litNodeClient.connect();
    }
  },

  getImageAccessControl(contractAddress: string, userAddress: string): AccessControlConditions {
    return {
      contractAddress: contractAddress,
      standardContractType: '',
      chain: 'sepolia',
      method: 'hasAccess',
      parameters: [userAddress], // Using userAddress in parameters
      returnValueTest: {
        comparator: '==',
        value: 'true'
      }
    };
  },

  async encryptFileForUser(
    file: File, 
    contractAddress: string, 
    userAddress: string
  ): Promise<EncryptionResult> {
    await this.connectClient();

    if (!this.litNodeClient) {
      throw new Error("Lit Node Client is not connected");
    }

    try {
      // Create access control with user address
      const accessControl = this.getImageAccessControl(contractAddress, userAddress);
      console.log('Encrypting file with access control:', accessControl);

      const { ciphertext, dataToEncryptHash } = await encryptFile(
        {
          accessControlConditions: [accessControl],
          file: file,
          chain: "ethereum"
        },
        this.litNodeClient
      );

      console.log('File encrypted successfully for user:', userAddress);
      return {
        encryptedFile: new Blob([ciphertext]),
        encryptedSymmetricKey: dataToEncryptHash
      };
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt file");
    }
  },

  async disconnect(): Promise<void> {
    if (this.litNodeClient) {
      await this.litNodeClient.disconnect();
      this.litNodeClient = null;
    }
  }
};