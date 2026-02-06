import React, { useState, useEffect } from 'react';
import { useWallet, portfolioAPI } from './WalletConnection.jsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-cyan-400">My Portfolios</h1>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-semibold transition"
          >
            ← Back to Home
          </button>
        </div>

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

                {/* PERFORMANCE CHART */}
                <div className="mb-6 bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-300">📈 Performance</h4>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Starting Value</div>
                        <div className="text-sm font-bold text-gray-400">$1,000.00</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Current Value</div>
                        <div className="text-sm font-bold text-cyan-400">$1,235.40</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Gain</div>
                        <div className="text-sm font-bold text-green-400">+23.5%</div>
                      </div>
                    </div>
                  </div>
                  
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={[
                      { date: 'Jan 1', value: 1000 },
                      { date: 'Jan 15', value: 1050, rebalance: true },
                      { date: 'Feb 1', value: 1120 },
                      { date: 'Feb 15', value: 1180, rebalance: true },
                      { date: 'Mar 1', value: 1235 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#6b7280" 
                        style={{ fontSize: '10px' }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        style={{ fontSize: '10px' }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#14171F', 
                          border: '1px solid rgba(34, 211, 238, 0.2)',
                          borderRadius: '8px',
                          fontSize: '11px'
                        }}
                        formatter={(value) => [`$${value}`, 'Value']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#22d3ee" 
                        strokeWidth={2}
                        dot={false}
                      />
                      {[
                        { date: 'Jan 15', value: 1050 },
                        { date: 'Feb 15', value: 1180 }
                      ].map((point, idx) => (
                        <ReferenceDot
                          key={idx}
                          x={point.date}
                          y={point.value}
                          r={4}
                          fill="#fbbf24"
                          stroke="#f59e0b"
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    <span>Rebalance points (2 total)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {portfolio.targets.map((target) => (
                    <div key={target.symbol} className="flex justify-between">
                      <span>{target.symbol}</span>
                      <span className="text-cyan-400">{target.percent}%</span>
                    </div>
                  ))}
                </div>
                
                {/* ACTIONS */}
                <div className="mt-6 pt-4 border-t border-gray-700 flex gap-3">
                  <button
                    onClick={() => alert('Edit feature coming soon! You will be able to adjust allocations and threshold.')}
                    className="flex-1 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg font-semibold transition"
                  >
                    ✏️ Edit Portfolio
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${portfolio.name}"? This cannot be undone.`)) {
                        alert('Delete feature coming soon!');
                      }
                    }}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-semibold transition"
                  >
                    🗑️ Delete
                  </button>
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
