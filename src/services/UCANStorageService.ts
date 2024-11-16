import { create, Client } from "@web3-storage/w3up-client";
import * as DID from '@ipld/dag-ucan/did';
import * as Delegation from '@ucanto/core/delegation';
import * as Signer from '@ucanto/principal/ed25519';
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory';

export class UCANStorageService {
  private client!: Client;
  private initialized = false;
  private static instance: UCANStorageService;

  private constructor() {
    this.initializeClient();
  }

  // Singleton pattern to ensure only one instance exists
  public static getInstance(): UCANStorageService {
    if (!UCANStorageService.instance) {
      UCANStorageService.instance = new UCANStorageService();
    }
    return UCANStorageService.instance;
  }

  private async initializeClient() {
    try {
      // Initialize with admin/service principal
      const principal = Signer.parse(process.env.NEXT_PUBLIC_W3UP_KEY!);
      const store = new StoreMemory();
      this.client = await create({ principal, store });
      
      // Add proof for the space
      const proof = await this.parseProof(process.env.NEXT_PUBLIC_W3UP_PROOF!);
      const space = await this.client.addSpace(proof);
      await this.client.setCurrentSpace(space.did());
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize UCAN client:', error);
      throw error;
    }
  }

  private async parseProof(data: string) {
    try {
      return Delegation.importDAG(JSON.parse(data));
    } catch (error) {
      console.error('Failed to parse proof:', error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeClient();
    }
  }

  async createDelegation(userDID: string) {
    await this.ensureInitialized();
    try {
      const audience = DID.parse(userDID);
      const abilities = [
        'space/blob/add',
        'space/index/add', 
        'filecoin/offer',
        'upload/add'
      ];
      
      // Delegation valid for 24 hours
      const expiration = Math.floor(Date.now() / 1000) + (60 * 60 * 24);
      
      const delegation = await this.client.createDelegation(
        audience,
        abilities,
        { expiration }
      );

      const archive = await delegation.archive();
      return archive.ok;
    } catch (error) {
      console.error('Failed to create delegation:', error);
      throw error;
    }
  }

  async uploadFile(file: File) {
    await this.ensureInitialized();
    try {
      // Create a virtual directory structure
      const files = [
        new File([file], file.name, { type: file.type })
      ];

      // Create metadata
      const metadata = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        uploadedBy: this.client.agent.did()
      };

      // Add metadata file
      const metadataFile = new File(
        [JSON.stringify(metadata, null, 2)],
        'metadata.json',
        { type: 'application/json' }
      );

      files.push(metadataFile);

      // Upload directory
      const cid = await this.client.uploadDirectory(files);
      
      return {
        cid: cid.toString(),
        url: `https://${cid}.ipfs.w3s.link/${file.name}`,
        metadataUrl: `https://${cid}.ipfs.w3s.link/metadata.json`
      };
    } catch (error) {
      console.error('Failed to upload directory:', error);
      throw error;
    }
  }
}

export const ucanStorage = UCANStorageService.getInstance();