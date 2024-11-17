import { StoredImage, ConnectedUser } from '../types';

export interface IStorachaService {
  ensureInitialized(): Promise<void>;
  uploadFile(file: File, ownerEmail: string): Promise<StoredImage>;
  getPersonalImages(ownerEmail: string): Promise<StoredImage[]>;
  getSharedImages(email: string): Promise<StoredImage[]>;
  connectUser(adminEmail: string, userEmail: string): Promise<void>;
  shareImage(cid: string, ownerEmail: string, recipientEmail: string): Promise<void>;
  revokeAccess(cid: string, ownerEmail: string, recipientEmail: string): Promise<void>;
  getConnectedUsers(adminEmail: string): Promise<ConnectedUser[]>;
}

class StorachaService implements IStorachaService {
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  public async ensureInitialized(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Server not available');
      }

      const data = await response.json();
      console.log('Server health check:', data);
    } catch (error) {
      console.error('Server health check failed:', error);
      throw new Error('Failed to connect to server');
    }
  }

  public async uploadFile(file: File, ownerEmail: string): Promise<StoredImage> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      return {
        cid: result.cid,
        url: result.url,
        metadataUrl: result.metadataUrl,
        name: file.name,
        timestamp: Date.now(),
        owner: ownerEmail,
        isRevoked: false,
        sharedWith: []
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error('Failed to upload file');
    }
  }

  public async getPersonalImages(ownerEmail: string): Promise<StoredImage[]> {
    const stored = localStorage.getItem(`images-${ownerEmail}`);
    return stored ? JSON.parse(stored) : [];
  }

  public async getSharedImages(email: string): Promise<StoredImage[]> {
    const stored = localStorage.getItem(`shared-images-${email}`);
    return stored ? JSON.parse(stored) : [];
  }

  public async connectUser(adminEmail: string, userEmail: string): Promise<void> {
    const users = await this.getConnectedUsers(adminEmail);
    if (!users.some(u => u.email === userEmail)) {
      users.push({ email: userEmail, status: 'pending' });
      localStorage.setItem(`connected-users-${adminEmail}`, JSON.stringify(users));
    }
  }

  public async shareImage(cid: string, ownerEmail: string, recipientEmail: string): Promise<void> {
    const images = await this.getPersonalImages(ownerEmail);
    const image = images.find(img => img.cid === cid);
    
    if (!image) {
      throw new Error('Image not found');
    }

    image.sharedWith = [...(image.sharedWith || []), recipientEmail];
    localStorage.setItem(`images-${ownerEmail}`, JSON.stringify(images));

    const sharedImages = await this.getSharedImages(recipientEmail);
    sharedImages.push(image);
    localStorage.setItem(`shared-images-${recipientEmail}`, JSON.stringify(sharedImages));
  }

  public async revokeAccess(cid: string, ownerEmail: string, recipientEmail: string): Promise<void> {
    const images = await this.getPersonalImages(ownerEmail);
    const image = images.find(img => img.cid === cid);
    
    if (!image) {
      throw new Error('Image not found');
    }

    image.isRevoked = true;
    image.sharedWith = image.sharedWith?.filter(email => email !== recipientEmail);
    localStorage.setItem(`images-${ownerEmail}`, JSON.stringify(images));

    const sharedImages = await this.getSharedImages(recipientEmail);
    const updatedSharedImages = sharedImages.filter(img => img.cid !== cid);
    localStorage.setItem(`shared-images-${recipientEmail}`, JSON.stringify(updatedSharedImages));
  }

  public async getConnectedUsers(adminEmail: string): Promise<ConnectedUser[]> {
    const stored = localStorage.getItem(`connected-users-${adminEmail}`);
    return stored ? JSON.parse(stored) : [];
  }
}

export const storachaService = new StorachaService();