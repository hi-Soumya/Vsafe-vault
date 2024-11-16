import React from 'react';
import { DynamicWidget, useDynamicContext } from '@dynamic-labs/sdk-react-core';

const Login: React.FC = () => {
  const { primaryWallet } = useDynamicContext();
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Couples Safe Vault
          </h1>
          <p className="text-gray-600 mb-8">
            Secure, encrypted image sharing for couples
          </p>
          
          {!primaryWallet ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Connect your wallet to start sharing encrypted images
              </p>
              <div className="flex justify-center">
                <DynamicWidget />
              </div>
            </div>
          ) : (
            <div className="text-green-600">
              <p>Wallet connected!</p>
              <p className="text-sm text-gray-500 mt-2">
                {primaryWallet.address}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col space-y-4">
            <h2 className="text-sm font-medium text-gray-500 text-center">
              Features:
            </h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center">
                <span className="mr-2">🔒</span>
                End-to-end encryption
              </li>
              <li className="flex items-center">
                <span className="mr-2">📸</span>
                Secure image sharing
              </li>
              <li className="flex items-center">
                <span className="mr-2">✍️</span>
                Consent-based access
              </li>
              <li className="flex items-center">
                <span className="mr-2">🌐</span>
                Decentralized storage
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;