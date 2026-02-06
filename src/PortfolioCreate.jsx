// PortfolioCreate.jsx - Portfolio creation form

import { useState } from 'react';
import { useWallet, portfolioAPI } from './WalletConnection.jsx';

export function PortfolioCreate() {
  const { wallet, connected } = useWallet();
  const [creating, setCreating] = useState(false);
  const [allocations, setAllocations] = useState({
    SOL: 30,
    USDC: 70
  });
  const [threshold, setThreshold] = useState(10);

  const AVAILABLE_TOKENS = ['SOL', 'USDC', 'USDT', 'BTC'];

  const handleAllocationChange = (token, value) => {
    setAllocations(prev => ({
      ...prev,
      [token]: parseFloat(value) || 0
    }));
  };

  const addToken = (token) => {
    if (!allocations[token]) {
      setAllocations(prev => ({ ...prev, [token]: 0 }));
    }
  };

  const removeToken = (token) => {
    const newAllocations = { ...allocations };
    delete newAllocations[token];
    setAllocations(newAllocations);
  };

  const getTotalAllocation = () => {
    return Object.values(allocations).reduce((sum, val) => sum + val, 0);
  };

  const handleCreatePortfolio = async () => {
    const total = getTotalAllocation();
    if (Math.abs(total - 100) > 0.1) {
      alert('Total allocation must equal 100%');
      return;
    }

    setCreating(true);
    try {
      // Convert to backend format
      const targets = Object.entries(allocations).map(([symbol, percent]) => ({
        symbol,
        percent
      }));

      const result = await portfolioAPI.createPortfolio(wallet, {
        name: 'My AutoFolio Portfolio',
        threshold,
        targets
      });

      console.log('✅ Portfolio created:', result);
      alert('Portfolio created successfully! You will receive email alerts when rebalancing is needed.');
      
      // Reset form
      setAllocations({ SOL: 30, USDC: 70 });
      setThreshold(10);
    } catch (error) {
      console.error('Failed to create portfolio:', error);
      alert('Failed to create portfolio. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  if (!connected) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 mb-4">Connect your wallet to create a portfolio</p>
      </div>
    );
  }

  const total = getTotalAllocation();
  const isValid = Math.abs(total - 100) < 0.1;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900 rounded-xl border border-gray-800">
      <h2 className="text-2xl font-bold text-cyan-400 mb-6">Create Portfolio</h2>

      {/* Allocations */}
      <div className="space-y-4 mb-6">
        {Object.entries(allocations).map(([token, percent]) => (
          <div key={token} className="flex items-center gap-4">
            <div className="w-20 font-bold text-cyan-400">{token}</div>
            <input
              type="number"
              value={percent}
              onChange={(e) => handleAllocationChange(token, e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-cyan-500 outline-none"
              min="0"
              max="100"
              step="0.1"
            />
            <span className="text-gray-400">%</span>
            <button
              onClick={() => removeToken(token)}
              className="px-3 py-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Add token */}
      <div className="mb-6">
        <label className="text-sm text-gray-400 mb-2 block">Add Token:</label>
        <div className="flex gap-2 flex-wrap">
          {AVAILABLE_TOKENS.filter(t => !allocations[t]).map(token => (
            <button
              key={token}
              onClick={() => addToken(token)}
              className="px-4 py-2 bg-gray-800 text-cyan-400 rounded-lg hover:bg-gray-700 transition border border-gray-700"
            >
              + {token}
            </button>
          ))}
        </div>
      </div>

      {/* Threshold */}
      <div className="mb-6">
        <label className="text-sm text-gray-400 mb-2 block">
          Rebalance Threshold: {threshold}%
        </label>
        <input
          type="range"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          min="5"
          max="20"
          step="1"
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Rebalance when any asset drifts {threshold}% from target
        </p>
      </div>

      {/* Total */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Total Allocation:</span>
          <span className={`text-xl font-bold ${isValid ? 'text-green-400' : 'text-red-400'}`}>
            {total.toFixed(1)}%
          </span>
        </div>
        {!isValid && (
          <p className="text-red-400 text-sm mt-2">Must equal 100%</p>
        )}
      </div>

      {/* Create button */}
      <button
        onClick={handleCreatePortfolio}
        disabled={!isValid || creating}
        className="w-full py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {creating ? 'Creating Portfolio...' : 'Create Portfolio'}
      </button>

      <p className="text-xs text-gray-500 mt-4 text-center">
        You'll receive email notifications when your portfolio needs rebalancing
      </p>
    </div>
  );
}

export default PortfolioCreate;
