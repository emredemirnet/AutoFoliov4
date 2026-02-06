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
    wallet: publicKey?.
