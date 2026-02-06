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

// Wallet Button with Modal
export function WalletButton() {
  const { wallet, connected, connecting, disconnectWallet, showModal, setShowModal, connectWallet } = useWallet();
  const [availableWallets, setAvailableWallets] = useState([]);

  useEffect(() => {
    setAvailableWallets(getWalletProviders());
  }, [showModal]);

  if (connected) {
    return (
      <button
        onClick={disconnectWallet}
        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-mono text-sm"
      >
        {wallet?.slice(0, 4)}...{wallet?.slice(-4)} ✅
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={connecting}
        className="px-6 py-2 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {/* Wallet Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-cyan-400">Connect Wallet</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            
            <div className="space-y-3">
              {availableWallets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No Solana wallets detected</p>
                  <div className="space-y-2">
                    <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" 
                       className="block px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-purple-400 transition">
                      👻 Install Phantom
                    </a>
                    <a href="https://solflare.com/" target="_blank" rel="noopener noreferrer"
                       className="block px-4 py-3 bg-orange-600/20 hover:bg-orange-600/30 rounded-lg text-orange-400 transition">
                      🔥 Install Solflare
                    </a>
                    <a href="https://backpack.app/" target="_blank" rel="noopener noreferrer"
                       className="block px-4 py-3 bg-black/40 hover:bg-black/60 border border-white/20 rounded-lg text-white transition">
                      🎒 Install Backpack
                    </a>
                  </div>
                </div>
              ) : (
                availableWallets.map((w) => (
                  <button
                    key={w.name}
                    onClick={() => connectWallet(w.provider)}
                    className="w-full px-4 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-3 transition group"
                  >
                    <span className="text-3xl">{w.icon}</span>
                    <span className="text-lg font-semibold text-white group-hover:text-cyan-400 transition">{w.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
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
