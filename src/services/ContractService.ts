import { ethers } from 'ethers';

const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "connectUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "cid",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "shareImage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "cid",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "revokeAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "cid",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "restoreAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "cid",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "hasAccess",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "isAdmin",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export class ContractService {
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;
  private isInitialized = false;

  constructor(public readonly contractAddress: string) {}

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    this.signer = provider.getSigner();
    this.contract = new ethers.Contract(this.contractAddress, CONTRACT_ABI, this.signer);
    this.isInitialized = true;
  }

  async checkIsAdmin(address: string): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');
    return await this.contract.isAdmin(address);
  }

  async connectUser(userAddress: string): Promise<void> {
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.connectUser(userAddress);
    await tx.wait();
  }

  async shareImage(cid: string, recipientAddress: string): Promise<void> {
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.shareImage(cid, recipientAddress);
    await tx.wait();
  }

  async revokeAccess(cid: string, recipientAddress: string): Promise<void> {
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.revokeAccess(cid, recipientAddress);
    await tx.wait();
  }

  async restoreAccess(cid: string, recipientAddress: string): Promise<void> {
    if (!this.contract) throw new Error('Contract not initialized');
    const tx = await this.contract.restoreAccess(cid, recipientAddress);
    await tx.wait();
  }

  async hasAccess(cid: string, userAddress: string): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');
    return await this.contract.hasAccess(cid, userAddress);
  }

  async waitForTransaction(tx: ethers.ContractTransaction): Promise<void> {
    await tx.wait();
  }
}

export const contractService = new ContractService(
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''
);