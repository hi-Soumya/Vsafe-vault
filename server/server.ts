import express from 'express';
import cors from 'cors';
import { create } from "@web3-storage/w3up-client";
import * as Signer from '@ucanto/principal/ed25519';
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory';
import * as Delegation from '@ucanto/core/delegation';
import dotenv from 'dotenv';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

class StorageService {
  private client: any;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Initialize with provided key
        const principal = Signer.parse(process.env.W3UP_KEY!);
        const store = new StoreMemory();
        this.client = await create({ principal, store });
        
        // Add provided proof
        const proofBytes = Buffer.from(process.env.W3UP_PROOF!, 'base64');
        const delegation = await Delegation.extract(proofBytes);
        
        if (!delegation.ok) {
          throw new Error('Failed to extract delegation');
        }

        const space = await this.client.addSpace(delegation.ok);
        await this.client.setCurrentSpace(space.did());
        
        this.initialized = true;
        console.log('Storage service initialized with space DID:', space.did());
      } catch (error) {
        console.error('Failed to initialize storage service:', error);
        throw error;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  async uploadFile(file: Buffer, filename: string, mimetype: string) {
    await this.initialize();

    try {
      const files = [
        new File([file], filename, { type: mimetype }),
        new File(
          [JSON.stringify({
            name: filename,
            type: mimetype,
            size: file.length,
            uploadedAt: new Date().toISOString()
          })],
          'metadata.json',
          { type: 'application/json' }
        )
      ];

      const cid = await this.client.uploadDirectory(files);
      
      return {
        cid: cid.toString(),
        url: `https://${cid}.ipfs.w3s.link/${filename}`,
        metadataUrl: `https://${cid}.ipfs.w3s.link/metadata.json`
      };
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  }
}

const storageService = new StorageService();

// Upload route
app.post('/api/upload', upload.single('file'), async (req: express.Request, res: express.Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('Received file:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const result = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    console.log('Upload successful:', result);
    res.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});