import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { create } from "@web3-storage/w3up-client";
import * as Signer from '@ucanto/principal/ed25519';
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Configure multer with memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Update CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Simple storage service
const storageService = {
  async uploadFile(file: Buffer, filename: string, mimetype: string) {
    try {
      // Generate a new key pair
      const principal = await Signer.generate();
      const store = new StoreMemory();
      const client = await create({ principal, store });

      // Create File objects
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

      // Upload to web3.storage
      const cid = await client.uploadDirectory(files);
      
      return {
        cid: cid.toString(),
        url: `https://${cid}.ipfs.w3s.link/${filename}`,
        metadataUrl: `https://${cid}.ipfs.w3s.link/metadata.json`
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }
};

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
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
    console.error('Server upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});