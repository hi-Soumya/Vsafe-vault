import React, { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { storachaService, ConnectedUser } from '../services/StorachaService';

const UserConnectionSection: React.FC = () => {
  const { user } = useDynamicContext();
  const [newUserEmail, setNewUserEmail] = useState('');
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConnectedUsers();
  }, [user?.email]);

  const loadConnectedUsers = async () => {
    if (!user?.email) return;
    
    try {
      const users = await storachaService.getConnectedUsers(user.email);
      setConnectedUsers(users);
    } catch (err) {
      console.error('Failed to load connected users:', err);
      setError('Failed to load connected users');
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !newUserEmail) return;

    setIsConnecting(true);
    setError(null);

    try {
      await storachaService.connectUser(user.email, newUserEmail);
      setConnectedUsers(prev => [...prev, { email: newUserEmail, status: 'pending' }]);
      setNewUserEmail('');
    } catch (error) {
      console.error('Error connecting with user:', error);
      setError('Failed to connect with user. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Connect with Users</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleConnect} className="mb-6">
        <div className="flex gap-4">
          <input
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="Enter user email"
            className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            disabled={isConnecting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </form>

      <div>
        <h3 className="font-medium text-gray-700 mb-4">Connected Users</h3>
        {connectedUsers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No connected users yet
          </p>
        ) : (
          <div className="space-y-2">
            {connectedUsers.map(user => (
              <div
                key={user.email}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <span className="text-gray-700">{user.email}</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  user.status === 'connected'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserConnectionSection;