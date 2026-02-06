import React, { useState, useEffect } from 'react';
import { useWallet } from './WalletConnection.jsx';

const PortfolioCreate = () => {
  const { wallet, connected } = useWallet();
  
  // Available tokens with all asset types
  const AVAILABLE_TOKENS = {
    // Crypto
    SOL: { name: 'Solana', type: 'crypto' },
    BTC: { name: 'Bitcoin', type: 'crypto' },
    ETH: { name: 'Ethereum', type: 'crypto' },
    USDC: { name: 'USD Coin', type: 'crypto' },
    USDT: { name: 'Tether', type: 'crypto' },
    
    // Stocks  
    TSLA: { name: 'Tesla', type: 'stock' },
    AAPL: { name: 'Apple', type: 'stock' },
    NVDA: { name: 'NVIDIA', type: 'stock' },
    MSFT: { name: 'Microsoft', type: 'stock' },
    GOOGL: { name: 'Google', type: 'stock' },
    
    // Commodities
    GOLD: { name: 'Gold', type: 'commodity' },
    SILVER: { name: 'Silver', type: 'commodity' },
  };

  const [portfolioName, setPortfolioName] = useState('My Portfolio');
  const [targets, setTargets] = useState([
    { symbol: 'SOL', percent: 30 },
    { symbol: 'USDC', percent: 70 }
  ]);
  const [threshold, setThreshold] = useState(10);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const used = targets.map(t => t.symbol);
    const available = Object.keys(AVAILABLE_TOKENS).filter(s => !used.includes(s));
    setAvailableTokens(available);
  }, [targets]);

  const addToken = (symbol) => {
    setTargets([...targets, { symbol, percent: 0 }]);
  };

  const removeToken = (symbol) => {
    setTargets(targets.filter(t => t.symbol !== symbol));
  };

  const updatePercent = (symbol, value) => {
    setTargets(targets.map(t => 
      t.symbol === symbol ? { ...t, percent: parseInt(value) || 0 } : t
    ));
  };

  const totalAllocation = targets.reduce((sum, t) => sum + t.percent, 0);

  const createPortfolio = async () => {
    if (!connected || totalAllocation !== 100) return;

    setCreating(true);
    try {
      const response = await fetch('https://autofolio-backend-production.up.railway.app/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: wallet,
          name: portfolioName,
          threshold: threshold,
          targets: targets
        })
      });

      if (response.ok) {
        setSuccess(true);
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          if (window.onPortfolioCreated) {
            window.onPortfolioCreated();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to create portfolio:', error);
      alert('Failed to create portfolio. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const getTypeColor = (symbol) => {
    const type = AVAILABLE_TOKENS[symbol]?.type;
    if (type === 'crypto') return 'text-cyan-400';
    if (type === 'stock') return 'text-blue-400';
    if (type === 'commodity') return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getTypeIcon = (symbol) => {
    const type = AVAILABLE_TOKENS[symbol]?.type;
    if (type === 'crypto') return '💰';
    if (type === 'stock') return '📈';
    if (type === 'commodity') return '🥇';
    return '🔷';
  };

  return (
    <div className="space-y-6">
      {/* DEMO MODE Badge */}
      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded font-bold">
            DEMO MODE
          </span>
          <span className="text-xs text-yellow-300">
            Simulation only - Real trading coming soon!
          </span>
        </div>
      </div>

      {/* Portfolio Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          Portfolio Name
        </label>
        <input
          type="text"
          value={portfolioName}
          onChange={(e) => setPortfolioName(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
        />
      </div>

      {/* Asset Allocation */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-3">
          Asset Allocation
        </label>
        
        <div className="space-y-3">
          {targets.map((target) => (
            <div key={target.symbol} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 w-32 ${getTypeColor(target.symbol)}`}>
                <span>{getTypeIcon(target.symbol)}</span>
                <span className="font-semibold">{target.symbol}</span>
              </div>
              
              <input
                type="number"
                min="0"
                max="100"
                value={target.percent}
                onChange={(e) => updatePercent(target.symbol, e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
              />
              
              <span className="text-gray-400">%</span>
              
              {targets.length > 2 && (
                <button
                  onClick={() => removeToken(target.symbol)}
                  className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Token */}
        {availableTokens.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-2">Add Token:</div>
            <div className="flex flex-wrap gap-2">
              {availableTokens.slice(0, 6).map(symbol => (
                <button
                  key={symbol}
                  onClick={() => addToken(symbol)}
                  className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 ${
                    AVAILABLE_TOKENS[symbol].type === 'crypto' ? 'bg-cyan-500/20 text-cyan-400' :
                    AVAILABLE_TOKENS[symbol].type === 'stock' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {getTypeIcon(symbol)} {symbol}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Threshold */}
      <div>
        <label className="text-sm font-semibold text-gray-300 mb-2 block">
          Rebalance Threshold: {threshold}%
        </label>
        <input
          type="range"
          min="5"
          max="30"
          value={threshold}
          onChange={(e) => setThreshold(parseInt(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-2">
          Rebalance when any asset drifts {threshold}% from target
        </p>
      </div>

      {/* Total */}
      <div className="bg-gray-800/50 rounded-lg p-4 flex justify-between items-center">
        <span className="text-gray-400">Total Allocation:</span>
        <span className={`text-2xl font-bold ${totalAllocation === 100 ? 'text-green-400' : 'text-red-400'}`}>
          {totalAllocation}%
        </span>
      </div>

      {/* Create Button */}
      <button
        onClick={createPortfolio}
        disabled={!connected || totalAllocation !== 100 || creating}
        className={`w-full py-4 rounded-xl font-bold ${
          !connected || totalAllocation !== 100 || creating
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-400 to-cyan-600 text-gray-900 hover:scale-105'
        }`}
      >
        {creating ? 'Creating...' : success ? '✓ Created!' : 'Create Portfolio'}
      </button>
    </div>
  );
};

export default PortfolioCreate;
