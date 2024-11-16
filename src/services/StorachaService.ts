import { StoredImage, ConnectedUser } from '../types';

export class StorachaService {
  private readonly apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  public async ensureInitialized(): Promise<void> {
    // Check server health
    const response = await fetch(`${this.apiUrl}/health`);
    if (!response.ok) {
      throw new Error('Server not available');
    }
  }

  public async uploadFile(file: File, ownerEmail: string): Promise<StoredImage> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.apiUrl}/api/upload`, {
        method: 'POST',
        body: formData
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
    return JSON.parse(localStorage.getItem(`images-${ownerEmail}`) || '[]');
  }

  public async getSharedImages(email: string): Promise<StoredImage[]> {
    return JSON.parse(localStorage.getItem(`shared-images-${email}`) || '[]');
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
    return JSON.parse(localStorage.getItem(`connected-users-${adminEmail}`) || '[]');
  }
}

export const storachaService = new StorachaService();