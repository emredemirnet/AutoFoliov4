import { useState, useEffect } from 'react';

const API_URL = 'https://autofolio-backend-production.up.railway.app';

// Detect available wallets
const getWalletProviders = () => {
  const providers = [];
  
  if (window.phantom?.solana?.isPhantom) {
    providers.push({ name: 'Phantom', provider: window.phantom.solana, icon: '👻' });
  }
  if (window.solflare?.isSolflare) {
    providers.push({ name: 'Solflare', provider: window.solflare, icon: '🔥' });
  }
  if (window.backpack) {
    providers.push({ name: 'Backpack', provider: window.backpack, icon: '🎒' });
  }
  if (window.coinbaseSolana) {
    providers.push({ name: 'Coinbase', provider: window.coinbaseSolana, icon: '🔵' });
  }
  
  return providers;
};

export function useWallet() {
  const [wallet, setWallet] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const connectWallet = async (provider) => {
    setConnecting(true);
    setShowModal(false);
    
    try {
      const resp = await provider.connect();
      const walletAddress = resp.publicKey.toString();
      
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
      localStorage.setItem('walletType', provider.name || 'unknown');
      
      console.log('✅ Wallet connected:', walletAddress);
    } catch (err) {
      console.error('Wallet connection failed:', err);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    const walletType = localStorage.getItem('walletType');
    const providers = getWalletProviders();
    const provider = providers.find(p => p.name === walletType)?.provider;
    
    if (provider && provider.disconnect) {
      await provider.disconnect();
    }
    
    setWallet(null);
    setConnected(false);
    localStorage.removeItem('wallet');
    localStorage.removeItem('walletType');
  };

  useEffect(() => {
    const savedWallet = localStorage.getItem('wallet');
    if (savedWallet) {
      setWallet(savedWallet);
      setConnected(true);
    }
  }, []);

  return {
    wallet,
    connected,
    connecting,
    connectWallet,
    disconnectWallet,
    showModal,
    setShowModal
  };
}

export function WalletButton() {
  const { wallet, connected, connecting, disconnectWallet, showModal, setShowModal, connectWallet } = useWallet();
  const [availableWallets, setAvailableWallets] = useState([]);

  useEffect(() => {
    setAvailableWallets(getWallet
