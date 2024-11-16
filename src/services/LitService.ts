import { LitEncryption } from '../LitProtocol/encryption';
import { LitDecryption } from '../LitProtocol/decryption';
import { EncryptionResult } from '../LitProtocol/types';

class LitService {
  private static instance: LitService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): LitService {
    if (!LitService.instance) {
      LitService.instance = new LitService();
    }
    return LitService.instance;
  }

  async initialize() {
    if (!this.initialized) {
      await LitEncryption.connectClient();
      await LitDecryption.connectClient();
      this.initialized = true;
    }
  }

  async encryptFileForUser(
    file: File,
    contractAddress: string,
    userAddress: string
  ): Promise<EncryptionResult> {
    await this.initialize();
    return LitEncryption.encryptFileForUser(file, contractAddress, userAddress);
  }

  async decryptSharedFile(
    encryptedFile: Blob,
    encryptedSymmetricKey: string,
    contractAddress: string
  ): Promise<Blob> {
    await this.initialize();
    return LitDecryption.decryptSharedFile(encryptedFile, encryptedSymmetricKey, contractAddress);
  }

  async cleanup() {
    await LitEncryption.disconnect();
    await LitDecryption.disconnect();
    this.initialized = false;
  }
}

export const litService = LitService.getInstance();