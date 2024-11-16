import React, { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { contractService } from '../services/ContractService';

const UserConnection: React.FC = () => {
  const { primaryWallet } = useDynamicContext();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (primaryWallet?.address) {
        try {
          const adminStatus = await contractService.checkIsAdmin(primaryWallet.address);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Failed to check admin status:', error);
        }
      }
    };

    checkAdminStatus();
  }, [primaryWallet?.address]);

  const handleConnect = async () => {
    if (!primaryWallet?.address || !recipientAddress || !isAdmin) return;

    setIsConnecting(true);
    setError(null);

    try {
      await contractService.connectUser(recipientAddress);
      setRecipientAddress('');
    } catch (err) {
      console.error('Failed to connect user:', err);
      setError('Failed to connect user. Please check the address and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Connect Users (Admin Only)
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="Enter user's Ethereum address"
          className="flex-1 p-2 border rounded"
          disabled={isConnecting}
        />
        <button
          onClick={handleConnect}
          disabled={isConnecting || !recipientAddress}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isConnecting ? 'Connecting...' : 'Connect User'}
        </button>
      </div>
    </div>
  );
};

export default UserConnection;