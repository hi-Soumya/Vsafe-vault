import React, { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

const VaultSection: React.FC = () => {
  const { primaryWallet } = useDynamicContext();
  const [partnerAddress, setPartnerAddress] = useState('');
  const [vaultName, setVaultName] = useState('');
  const [isCreatingVault, setIsCreatingVault] = useState(false);

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryWallet) return;
    
    setIsCreatingVault(true);
    try {
      // Vault creation logic
      const vaultData = {
        name: vaultName,
        owner: primaryWallet.address,
        partner: partnerAddress,
        createdAt: new Date().toISOString()
      };
      
      console.log('Creating vault:', vaultData);
      // TODO: Implement actual vault creation logic
      
    } catch (error) {
      console.error('Error creating vault:', error);
    } finally {
      setIsCreatingVault(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Vault</h2>
      
      <form onSubmit={handleCreateVault} className="space-y-6">
        <div>
          <label htmlFor="vaultName" className="block text-sm font-medium text-gray-700">
            Vault Name
          </label>
          <input
            type="text"
            id="vaultName"
            value={vaultName}
            onChange={(e) => setVaultName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="partnerAddress" className="block text-sm font-medium text-gray-700">
            Partner's Wallet Address
          </label>
          <input
            type="text"
            id="partnerAddress"
            value={partnerAddress}
            onChange={(e) => setPartnerAddress(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="0x..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isCreatingVault || !primaryWallet}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {isCreatingVault ? 'Creating...' : 'Create Vault'}
        </button>
      </form>
    </div>
  );
};

export default VaultSection;