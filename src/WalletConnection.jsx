import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter, BackpackWalletAdapter, CoinbaseWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

// Solana Wallet Adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

const API_URL = 'https://autofolio-backend-production.up.railway.app';

// Wallet Context Provider
export function WalletContextProvider({ children }) {
  const endpoint = useMemo(() => clusterApiUrl('mainnet-beta'), []);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new CoinbaseWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// Custom hook
export function useWallet() {
  const { publicKey, connected, connecting, disconnect } = useSolanaWallet();
  
  return {
    wallet: publicKey?.toString(),
    connected,
    connecting,
    disconnectWallet: disconnect
  };
}

// Wallet Button
export function WalletButton() {
  return (
    <WalletMultiButton className="!bg-cyan-500 hover:!bg-cyan-400 !text-black !font-bold !rounded-lg !px-6 !py-2" />
  );
}

// Portfolio API functions
export const portfolioAPI = {
  async createPortfolio(wallet, portfolioData) {
    const response = await fetch(`${API_URL}/api/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: wallet,
        name: portfolioData.name || 'My Portfolio',
        threshold: portfolioData.threshold || 10,
        targets: portfolioData.targets
      })
    });
    return response.json();
  },

  async getPortfolios(wallet) {
    const response = await fetch(`${API_URL}/api/portfolios/${wallet}`);
    return response.json();
  },

  async getBalances(wallet) {
    const response = await fetch(`${API_URL}/api/balances/${wallet}`);
    return response.json();
  },

  async getPrices() {
    const response = await fetch(`${API_URL}/api/prices`);
    return response.json();
  },

  async getSwapQuote(inputToken, outputToken, amount) {
    const response = await fetch(`${API_URL}/api/swap/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputToken, outputToken, amount })
    });
    return response.json();
  }
};

export default useWallet;
