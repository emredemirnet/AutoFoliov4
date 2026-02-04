// WalletConnection.jsx - Add to your React app

import { useState, useEffect } from 'react';

const API_URL = 'https://autofolio-backend-production.up.railway.app';

export function useWallet() {
  const [wallet, setWallet] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Check if Phantom is installed
  const getProvider = () => {
    if ('phantom' in window) {
      const provider = window.phantom?.solana;
      if (provider?.isPhantom) {
        return provider;
      }
    }
    window.open('https://phantom.app/', '_blank');
  };

  // Connect wallet
  const connectWallet = async () => {
    setConnecting(true);
    try {
      const provider = getProvider();
      if (!provider) {
        alert('Please install Phantom wallet!');
        return;
      }

      const resp = await provider.connect();
      const walletAddress = resp.publicKey.toString();
      
      // Save to backend
      await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          wallet_address: walletAddress,
          email: null 
        })
      });

      setWallet(walletAddress);
      setConnected(true);
      localStorage.setItem('wallet', walletAddress);
      
      console.log('✅ Wallet connected:', walletAddress);
    } catch (err) {
      console.error('Wallet connection failed:', err);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    const provider = getProvider();
    if (provider) {
      await provider.disconnect();
    }
    setWallet(null);
    setConnected(false);
    localStorage.removeItem('wallet');
  };

  // Auto-connect on load
  useEffect(() => {
    const savedWallet = localStorage.getItem('wallet');
    if (savedWallet) {
      setWallet(savedWallet);
      setConnected(true);
    }

    // Listen for account changes
    const provider = getProvider();
    if (provider) {
      provider.on('accountChanged', (publicKey) => {
        if (publicKey) {
          const address = publicKey.toString();
          setWallet(address);
          localStorage.setItem('wallet', address);
        } else {
          disconnectWallet();
        }
      });
    }
  }, []);

  return {
    wallet,
    connected,
    connecting,
    connectWallet,
    disconnectWallet
  };
}

// WalletButton component
export function WalletButton() {
  const { wallet, connected, connecting, connectWallet, disconnectWallet } = useWallet();

  if (connected) {
    return (
      <button
        onClick={disconnectWallet}
        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
      >
        {wallet?.slice(0, 4)}...{wallet?.slice(-4)} ✅
      </button>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={connecting}
      className="px-6 py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50"
    >
      {connecting ? 'Connecting...' : 'Connect Phantom'}
    </button>
  );
}

// Portfolio API functions
export const portfolioAPI = {
  // Create portfolio
  async createPortfolio(wallet, portfolioData) {
    const response = await fetch(`${API_URL}/api/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: wallet,
        name: portfolioData.name || 'My Portfolio',
        threshold: portfolioData.threshold || 10,
        targets: portfolioData.targets // [{ symbol: 'SOL', percent: 30 }, ...]
      })
    });
    return response.json();
  },

  // Get user portfolios
  async getPortfolios(wallet) {
    const response = await fetch(`${API_URL}/api/portfolios/${wallet}`);
    return response.json();
  },

  // Get wallet balances
  async getBalances(wallet) {
    const response = await fetch(`${API_URL}/api/balances/${wallet}`);
    return response.json();
  },

  // Get current prices
  async getPrices() {
    const response = await fetch(`${API_URL}/api/prices`);
    return response.json();
  },

  // Get swap quote
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
