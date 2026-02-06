import React, { useState, useEffect } from 'react';
import { useWallet, portfolioAPI } from './WalletConnection.jsx';

const Dashboard = () => {
  const { wallet, connected } = useWallet();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected && wallet) {
      loadPortfolios();
    }
  }, [connected, wallet]);

  const loadPortfolios = async () => {
    try {
      const response = await fetch(
        `https://autofolio-backend-production.up.railway.app/api/portfolios/${wallet}`
      );
      const data = await response.json();
      setPortfolios(data);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-cyan-400 mb-4">Connect Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to view dashboard</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 flex items-center justify-center">
        <div className="text-6xl animate-pulse">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-400 mb-8">My Portfolios</h1>

        {portfolios.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400 mb-6">No portfolios yet</p>
            <a
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-cyan-600 text-gray-900 font-bold rounded-xl"
            >
              Create Portfolio
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className="bg-gray-800/50 border border-cyan-400/30 rounded-xl p-6"
              >
                <h3 className="text-2xl font-bold text-cyan-400 mb-4">
                  {portfolio.name}
                </h3>
                <div className="text-sm text-gray-400 mb-4">
                  Threshold: {portfolio.threshold}%
                </div>
                <div className="space-y-2">
                  {portfolio.targets.map((target) => (
                    <div key={target.symbol} className="flex justify-between">
                      <span>{target.symbol}</span>
                      <span className="text-cyan-400">{target.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
