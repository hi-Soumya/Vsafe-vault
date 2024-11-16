import { create, Client } from "@web3-storage/w3up-client";
import * as Signer from '@ucanto/principal/ed25519';
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory';
import { litService } from './LitService';

// Types
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

export interface UploadResult {
  cid: string;
  url: string;
  metadataUrl: string;
}

export class StorachaService {
  private client!: Client;
  private initialized = false;
  private adminEmail: string = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
  private contractAddress: string = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
  private connectedUsers: Map<string, ConnectedUser[]> = new Map();
  private sharedImages: Map<string, StoredImage[]> = new Map();
  private store: StoreMemory;

  constructor() {
    this.store = new StoreMemory();
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      if (!process.env.NEXT_PUBLIC_W3UP_KEY) {
        throw new Error('W3UP_KEY not found in environment variables');
      }

      // Initialize with the principal (DID key)
      const principal = Signer.parse(process.env.NEXT_PUBLIC_W3UP_KEY);
      this.client = await create({ principal, store: this.store });
      
      try {
        // Create a default space if none exists
        const spaceName = 'default-space';
        const space = await this.client.createSpace(spaceName);
        await this.client.setCurrentSpace(space.did());
        console.log('Space created or already exists:', space.did());
      } catch (error) {
        console.log('Space might already exist:', error);
      }

      this.initialized = true;
      console.log('Storacha client initialized with DID:', this.client.agent.did());
    } catch (error) {
      console.error('Failed to initialize Storacha client:', error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeClient();
    }
    if (!this.client.currentSpace()) {
      throw new Error('No space selected');
    }
  }

  async login(email: string) {
    await this.ensureInitialized();
    try {
      console.log('Attempting login for:', email);
      const formattedEmail = this.formatEmail(email);
      const account = await this.client.login(formattedEmail);
      await account.plan.wait();
      console.log('Login successful for:', email);
      return account;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async checkAdminStatus(email: string): Promise<boolean> {
    const isAdmin = email === this.adminEmail;
    console.log('Admin status check for', email, ':', isAdmin);
    return isAdmin;
  }

  async uploadFile(file: File, ownerEmail: string): Promise<StoredImage> {
    await this.ensureInitialized();
    console.log('Starting file upload for:', ownerEmail);

    try {
      // First encrypt the file using Lit Protocol
      const { encryptedFile, encryptedSymmetricKey } = await litService.encryptFileForUser(
        file,
        this.contractAddress,
        ownerEmail
      );
      console.log('File encrypted successfully');

      // Create directory structure
      const files = [
        new File([encryptedFile], file.name, { type: file.type })
      ];

      // Create metadata
      const metadata = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        owner: ownerEmail,
        isEncrypted: true,
        uploadedBy: this.client.agent.did(),
        timestamp: Date.now()
      };

      const metadataFile = new File(
        [JSON.stringify(metadata, null, 2)],
        'metadata.json',
        { type: 'application/json' }
      );

      files.push(metadataFile);

      // Upload to space
      console.log('Uploading to Storacha...');
      const cid = await this.client.uploadDirectory(files);
      console.log('Upload successful, CID:', cid.toString());

      const storedImage: StoredImage = {
        cid: cid.toString(),
        url: `https://${cid}.ipfs.w3s.link/${file.name}`,
        metadataUrl: `https://${cid}.ipfs.w3s.link/metadata.json`,
        name: file.name,
        timestamp: Date.now(),
        owner: ownerEmail,
        encryptedSymmetricKey,
        isRevoked: false,
        sharedWith: []
      };

      // Store in memory
      const userImages = this.sharedImages.get(ownerEmail) || [];
      userImages.push(storedImage);
      this.sharedImages.set(ownerEmail, userImages);

      console.log('Image stored successfully:', storedImage.cid);
      return storedImage;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }

  async shareImage(cid: string, ownerEmail: string, recipientEmail: string): Promise<void> {
    try {
      console.log(`Sharing image ${cid} from ${ownerEmail} to ${recipientEmail}`);
      const userImages = this.sharedImages.get(ownerEmail) || [];
      const image = userImages.find(img => img.cid === cid);
      
      if (!image) {
        throw new Error('Image not found');
      }
      
      // Update sharing status
      image.sharedWith = [...(image.sharedWith || []), recipientEmail];
      this.sharedImages.set(ownerEmail, userImages);

      console.log('Image shared successfully');
    } catch (error) {
      console.error('Failed to share image:', error);
      throw error;
    }
  }

  async revokeAccess(cid: string, ownerEmail: string, recipientEmail: string): Promise<void> {
    try {
      console.log(`Revoking access for image ${cid} from ${recipientEmail}`);
      const userImages = this.sharedImages.get(ownerEmail) || [];
      const image = userImages.find(img => img.cid === cid);
      
      if (!image) {
        throw new Error('Image not found');
      }
      
      // Update revocation status
      image.isRevoked = true;
      // Remove recipient from sharedWith array
      image.sharedWith = image.sharedWith?.filter(email => email !== recipientEmail);
      
      this.sharedImages.set(ownerEmail, userImages);
      console.log('Access revoked successfully');
    } catch (error) {
      console.error('Failed to revoke access:', error);
      throw error;
    }
  }

  async getPersonalImages(email: string): Promise<StoredImage[]> {
    console.log('Fetching personal images for:', email);
    const images = this.sharedImages.get(email) || [];
    console.log(`Found ${images.length} personal images`);
    return images;
  }

  async getSharedImages(email: string): Promise<StoredImage[]> {
    console.log('Fetching shared images for:', email);
    const allImages: StoredImage[] = [];
    this.sharedImages.forEach((images) => {
      images.forEach(image => {
        if (image.sharedWith?.includes(email) && !image.isRevoked) {
          allImages.push(image);
        }
      });
    });
    console.log(`Found ${allImages.length} shared images`);
    return allImages;
  }

  async connectUser(adminEmail: string, userEmail: string): Promise<void> {
    try {
      console.log(`Connecting user ${userEmail} to admin ${adminEmail}`);
      const userList = this.connectedUsers.get(adminEmail) || [];
      userList.push({ email: userEmail, status: 'pending' });
      this.connectedUsers.set(adminEmail, userList);
      console.log('User connected successfully');
    } catch (error) {
      console.error('Failed to connect user:', error);
      throw error;
    }
  }

  async getConnectedUsers(adminEmail: string): Promise<ConnectedUser[]> {
    console.log('Fetching connected users for:', adminEmail);
    const users = this.connectedUsers.get(adminEmail) || [];
    console.log(`Found ${users.length} connected users`);
    return users;
  }

  private formatEmail(email: string): `${string}@${string}` {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) {
      throw new Error('Invalid email format');
    }
    return `${localPart}@${domain}` as `${string}@${string}`;
  }

  // Helper method to reset service state (useful for testing)
  async reset() {
    this.initialized = false;
    this.connectedUsers.clear();
    this.sharedImages.clear();
    await this.initializeClient();
  }
}

// Export singleton instance
export const storachaService = new StorachaService();