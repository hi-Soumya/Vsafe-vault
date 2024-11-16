import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { decryptToFile } from "@lit-protocol/lit-node-client";
import { LitNetwork } from "@lit-protocol/constants";
import { AccessControlConditions } from './types';
import { arrayBufferToBase64 } from './utils';

export const LitDecryption = {
  litNodeClient: null as LitNodeClient | null,

  async connectClient(): Promise<void> {
    if (!this.litNodeClient) {
      this.litNodeClient = new LitNodeClient({
        litNetwork: LitNetwork.DatilDev
      });
      await this.litNodeClient.connect();
    }
  },

  getImageAccessControl(contractAddress: string): AccessControlConditions {
    return {
      contractAddress: contractAddress,
      standardContractType: '',
      chain: 'sepolia',
      method: 'hasAccess',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '==',
        value: 'true'
      }
    };
  },

  async decryptSharedFile(
    encryptedFile: Blob,
    encryptedSymmetricKey: string,
    contractAddress: string
  ): Promise<Blob> {
    await this.connectClient();

    if (!this.litNodeClient) {
      throw new Error("Lit Node Client is not connected");
    }

    try {
      const arrayBuffer = await encryptedFile.arrayBuffer();
      const base64Ciphertext = arrayBufferToBase64(arrayBuffer);
      const accessControl = this.getImageAccessControl(contractAddress);

      console.log('Attempting to decrypt with access conditions:', accessControl);

      const decryptedFile = await decryptToFile(
        {
          accessControlConditions: [accessControl],
          ciphertext: base64Ciphertext,
          dataToEncryptHash: encryptedSymmetricKey,
          chain: "ethereum"
        },
        this.litNodeClient
      );

      console.log('File decrypted successfully');
      return new Blob([decryptedFile]);
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt file - Access denied");
    }
  },

  async disconnect(): Promise<void> {
    if (this.litNodeClient) {
      await this.litNodeClient.disconnect();
      this.litNodeClient = null;
    }
  }
};