import React, { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { storachaService } from '../../services/StorachaService';

const UserConnection: React.FC = () => {
  const { user } = useDynamicContext();
  const [newUserEmail, setNewUserEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!user?.email || !newUserEmail) return;

    try {
      setError(null);
      await storachaService.connectUser(user.email, newUserEmail);
      setNewUserEmail('');
    } catch (err) {
      setError('Failed to connect with user');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Connect with Users
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <input
          type="email"
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
          placeholder="Enter user email"
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleConnect}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Connect
        </button>
      </div>
    </div>
  );
};

export default UserConnection;