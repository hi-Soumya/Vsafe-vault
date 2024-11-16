import React from 'react';
import {
  DynamicContextProvider,
  DynamicWidget,
  useDynamicContext
} from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { createConfig, http, WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mainnet } from 'viem/chains';
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { LitProvider } from './LitProtocol/LitContextProvider';
import Login from './dynamic/Login';
import Dashboard from './components/Dashboard';
import { StorachaProvider } from './components/StorachaProvider';  // Added import

const config = createConfig({
  chains: [mainnet],
  multiInjectedProviderDiscovery: false,
  transports: {
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

function MainContent() {
  const { primaryWallet, user } = useDynamicContext();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (primaryWallet !== undefined) {
      setIsLoading(false);
    }
  }, [primaryWallet]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isAuthenticated = !!primaryWallet && !!user;

  return (
    <div className="min-h-screen bg-gray-100">
      {!isAuthenticated ? (
        <Login />
      ) : (
        <>
          <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Safe Vault</h1>
              <DynamicWidget />
            </div>
          </header>
          <main>
            <Dashboard />
          </main>
        </>
      )}
    </div>
  );
}

const App = () => {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: "ecf70e82-6489-4a51-8563-75d6514be95c",
        walletConnectors: [EthereumWalletConnectors],
        displaySiweStatement: true,
        shadowDOMEnabled: false,
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <LitProvider>
              <StorachaProvider>
                <MainContent />
              </StorachaProvider>
            </LitProvider>
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
};

export default App;