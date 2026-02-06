import React, { useState, useEffect } from 'react';
import { WalletButton, useWallet, portfolioAPI } from './WalletConnection.jsx';
import PortfolioCreate from './PortfolioCreate.jsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';

const API_URL = 'https://autofolio-backend-production.up.railway.app';

// Seeded random for consistent fallback data (stocks/commodities)
let _seed = 12345;
const seededRandom = () => {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed & 0x7fffffff) / 2147483647;
};
const resetSeed = (allocations, threshold) => {
  let hash = threshold * 1000;
  Object.entries(allocations).sort().forEach(([key, val]) => {
    for (let i = 0; i < key.length; i++) {
      hash = hash * 31 + key.charCodeAt(i);
    }
    hash = hash * 31 + val;
  });
  _seed = Math.abs(hash) % 2147483647 || 1;
};

// Generate seeded mean-reverting data (fallback for non-crypto assets)
const generateMeanRevertingData = (startPrice, baseVolatility, days = 365) => {
  const prices = [startPrice];
  const cycleLength = 60;
  const numCycles = Math.floor(days / cycleLength);
  
  for (let cycle = 0; cycle < numCycles; cycle++) {
    const isPumping = (cycle % 2) === 0;
    const trend = isPumping ? 0.012 : -0.008;
    
    for (let i = 0; i < cycleLength && prices.length < days; i++) {
      const prevPrice = prices[prices.length - 1];
      const trendMove = prevPrice * trend;
      const randomMove = prevPrice * (seededRandom() - 0.5) * baseVolatility * 3;
      const distanceFromStart = (prevPrice - startPrice) / startPrice;
      const meanReversionForce = -distanceFromStart * prevPrice * 0.005;
      
      let newPrice = prevPrice + trendMove + randomMove + meanReversionForce;
      newPrice = Math.max(newPrice, startPrice * 0.5);
      newPrice = Math.min(newPrice, startPrice * 2.5);
      
      prices.push(newPrice);
    }
  }
  
  while (prices.length < days) {
    const prevPrice = prices[prices.length - 1];
    const move = prevPrice * (seededRandom() - 0.5) * baseVolatility;
    prices.push(prevPrice + move);
  }
  
  return prices.slice(0, days);
};

const DISPLAY_INTERVALS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 364];

// Generate month labels from 12 months ago to today
const getMonthLabels = () => {
  const now = new Date();
  const labels = [];
  for (let i = 12; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (i === 0) {
      labels.push('Today');
    } else {
      labels.push(`${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`);
    }
  }
  return labels;
};

const MONTHS = getMonthLabels();

const AutoFolio = ({ presetStrategy, onDashboard }) => {
  const getInitialAllocations = () => {
    if (presetStrategy && presetStrategy.allocation) {
      const allocs = {};
      presetStrategy.allocation.forEach(item => {
        allocs[item.asset] = item.percent;
      });
      return allocs;
    }
    return { SOL: 40, BTC: 30, USDC: 30 };
  };

  const getInitialAssets = () => {
    if (presetStrategy && presetStrategy.allocation) {
      return presetStrategy.allocation.map(item => item.asset);
    }
    return ['SOL', 'BTC', 'USDC'];
  };

  const getInitialThreshold = () => {
    return presetStrategy?.threshold || 10;
  };

  const getPresetTargets = () => {
    if (presetStrategy && presetStrategy.allocation) {
      return presetStrategy.allocation.map(item => ({
        symbol: item.asset,
        percent: item.percent
      }));
    }
    return null;
  };

  const [allocations, setAllocations] = useState(getInitialAllocations());
  const [selectedAssets, setSelectedAssets] = useState(getInitialAssets());
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [assetSearch, setAssetSearch] = useState('');
  const { wallet, connected } = useWallet();
  
  const [activeTab, setActiveTab] = useState('simulate');
  
  const [realPrices, setRealPrices] = useState(null);
  const [historicalPrices, setHistoricalPrices] = useState(null);
  const [walletBalances, setWalletBalances] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  
  const availableAssets = {
    BTC: { name: 'Bitcoin', type: 'crypto', color: '#F7931A' },
    ETH: { name: 'Ethereum', type: 'crypto', color: '#627EEA' },
    SOL: { name: 'Solana', type: 'crypto', color: '#14F195' },
    USDC: { name: 'USD Coin', type: 'crypto', color: '#2775CA' },
    USDT: { name: 'Tether', type: 'crypto', color: '#26A17B' },
    AAPL: { name: 'Apple', type: 'stock', color: '#A2AAAD' },
    TSLA: { name: 'Tesla', type: 'stock', color: '#E31937' },
    NVDA: { name: 'NVIDIA', type: 'stock', color: '#76B900' },
    MSFT: { name: 'Microsoft', type: 'stock', color: '#00A4EF' },
    GOOGL: { name: 'Google', type: 'stock', color: '#4285F4' },
    GOLD: { name: 'Gold', type: 'commodity', color: '#FFD700' },
    SILVER: { name: 'Silver', type: 'commodity', color: '#C0C0C0' },
  };
  
  const [deviationThreshold, setDeviationThreshold] = useState(getInitialThreshold());
  const [simulationData, setSimulationData] = useState(null);
  const [rebalancePoints, setRebalancePoints] = useState([]);
  const [dataSource, setDataSource] = useState(''); // Track data source for display

  const assets = selectedAssets;
  
  const assetColors = Object.fromEntries(
    selectedAssets.map(asset => [asset, availableAssets[asset]?.color || '#888888'])
  );

  // Auto-run simulation when preset strategy is loaded AND historical data is ready
  useEffect(() => {
    if (presetStrategy && (historicalPrices || realPrices)) {
      setTimeout(() => runSimulation(), 200);
    }
  }, [presetStrategy, historicalPrices]);

  useEffect(() => {
    window.onPortfolioCreated = () => {
      if (onDashboard) onDashboard();
    };
    return () => { window.onPortfolioCreated = null; };
  }, [onDashboard]);

  // Fetch prices on mount
  useEffect(() => {
    fetchRealPrices();
    fetchHistoricalPrices();
  }, []);

  useEffect(() => {
    if (connected && wallet) fetchWalletBalances();
  }, [connected, wallet]);

  const fetchRealPrices = async () => {
    setLoadingPrices(true);
    try {
      const prices = await portfolioAPI.getPrices();
      if (!prices.SOL || prices.SOL === 0) {
        setRealPrices({ SOL: 150, BTC: 95000, ETH: 3500, USDC: 1, USDT: 1 });
      } else {
        setRealPrices(prices);
        console.log('✅ Real prices loaded:', prices);
      }
    } catch (error) {
      setRealPrices({ SOL: 150, BTC: 95000, ETH: 3500, USDC: 1, USDT: 1 });
    } finally {
      setLoadingPrices(false);
    }
  };

  const fetchHistoricalPrices = async () => {
    setLoadingHistorical(true);
    try {
      const response = await fetch(`${API_URL}/api/historical-prices`);
      if (response.ok) {
        const data = await response.json();
        setHistoricalPrices(data);
        console.log('✅ Historical prices loaded:', Object.keys(data));
      }
    } catch (error) {
      console.error('Failed to fetch historical prices:', error);
    } finally {
      setLoadingHistorical(false);
    }
  };

  const fetchWalletBalances = async () => {
    try {
      const balances = await portfolioAPI.getBalances(wallet);
      setWalletBalances(balances);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  };

  const handleAllocationChange = (asset, value) => {
    setAllocations(prev => ({ ...prev, [asset]: value }));
  };

  const getCryptoData = () => {
    const basePrices = realPrices || {
      BTC: 95000, ETH: 3500, SOL: 150, USDC: 1, USDT: 1,
      AAPL: 180, TSLA: 250, NVDA: 500, MSFT: 380, GOOGL: 140,
      GOLD: 2000, SILVER: 24,
    };

    const data = {};
    let usingReal = [];
    let usingSimulated = [];

    for (const asset of assets) {
      // Use real CoinGecko data if available
      if (historicalPrices && historicalPrices[asset] && historicalPrices[asset].length >= 365) {
        data[asset] = historicalPrices[asset].slice(-365);
        usingReal.push(asset);
      } else if (asset === 'USDC' || asset === 'USDT') {
        data[asset] = Array(365).fill(1);
        usingReal.push(asset);
      } else {
        // Fallback: seeded simulation for stocks/commodities/missing data
        data[asset] = generateMeanRevertingData(basePrices[asset] || 100, 0.04, 365);
        usingSimulated.push(asset);
      }
    }

    // Update data source display
    if (usingReal.length > 0 && usingSimulated.length === 0) {
      setDataSource('🟢 Real market data (CoinGecko)');
    } else if (usingReal.length > 0) {
      setDataSource(`🟢 Real: ${usingReal.join(', ')} | 🟡 Simulated: ${usingSimulated.join(', ')}`);
    } else {
      setDataSource('🟡 Simulated data');
    }

    return data;
  };

  const calculateRebalancingStrategy = (targetAllocations, threshold, initialInvestment = 10000) => {
    const CRYPTO_DATA = getCryptoData();
    const days = Math.min(...assets.map(a => CRYPTO_DATA[a]?.length || 365));
    const results = [];
    const rebalances = [];
    
    let holdings = {};
    assets.forEach(asset => {
      const allocation = targetAllocations[asset] / 100;
      const investmentAmount = initialInvestment * allocation;
      holdings[asset] = investmentAmount / CRYPTO_DATA[asset][0];
    });

    for (let i = 0; i < days; i++) {
      let totalValue = 0;
      let currentAllocations = {};
      
      assets.forEach(asset => {
        const assetValue = holdings[asset] * CRYPTO_DATA[asset][i];
        totalValue += assetValue;
        currentAllocations[asset] = assetValue;
      });

      let needsRebalancing = false;
      assets.forEach(asset => {
        const currentPercent = (currentAllocations[asset] / totalValue) * 100;
        const targetPercent = targetAllocations[asset];
        const deviationThresholdAmount = targetPercent * (threshold / 100);
        
        if (Math.abs(currentPercent - targetPercent) > deviationThresholdAmount) {
          needsRebalancing = true;
        }
      });

      if (needsRebalancing && i > 0) {
        const changes = [];
        assets.forEach(asset => {
          const currentPercent = (currentAllocations[asset] / totalValue) * 100;
          const targetPercent = targetAllocations[asset];
          const diff = currentPercent - targetPercent;
          if (Math.abs(diff) > 0.5) {
            changes.push({
              asset,
              from: currentPercent.toFixed(1),
              to: targetPercent.toFixed(1),
              action: diff > 0 ? 'SELL' : 'BUY'
            });
          }
        });
        
        const TRADING_FEE = 0.003;
        let totalFees = 0;
        
        assets.forEach(asset => {
          const currentValue = currentAllocations[asset];
          const targetValue = totalValue * (targetAllocations[asset] / 100);
          const valueChange = Math.abs(targetValue - currentValue);
          if (targetValue > currentValue) {
            totalFees += valueChange * TRADING_FEE;
          }
        });
        
        totalValue -= totalFees;
        
        assets.forEach(asset => {
          const targetValue = totalValue * (targetAllocations[asset] / 100);
          holdings[asset] = targetValue / CRYPTO_DATA[asset][i];
        });
        
        const monthIndex = Math.round((i / (days - 1)) * 12);
        const displayMonth = MONTHS[Math.min(monthIndex, 12)];
        
        rebalances.push({ month: displayMonth, value: totalValue, day: i, changes });
      }

      results.push(totalValue);
    }

    return { results, rebalances, days };
  };

  const calculateBuyAndHold = (targetAllocations, initialInvestment = 10000) => {
    const CRYPTO_DATA = getCryptoData();
    const days = Math.min(...assets.map(a => CRYPTO_DATA[a]?.length || 365));
    const results = [];
    
    const holdings = {};
    assets.forEach(asset => {
      const allocation = targetAllocations[asset] / 100;
      const investmentAmount = initialInvestment * allocation;
      holdings[asset] = investmentAmount / CRYPTO_DATA[asset][0];
    });

    for (let i = 0; i < days; i++) {
      let totalValue = 0;
      assets.forEach(asset => {
        totalValue += holdings[asset] * CRYPTO_DATA[asset][i];
      });
      results.push(totalValue);
    }

    return { results, days };
  };

  const runSimulation = () => {
    const total = Object.values(allocations).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) return;

    // Reset seed for consistent fallback data
    resetSeed(allocations, deviationThreshold);

    const { results: rebalancingResults, rebalances, days } = calculateRebalancingStrategy(allocations, deviationThreshold);
    const { results: buyAndHoldResults } = calculateBuyAndHold(allocations);

    // Map results to display intervals
    const displayIntervals = DISPLAY_INTERVALS.map(d => Math.min(d, days - 1));

    const chartData = MONTHS.map((month, i) => {
      const dayIndex = displayIntervals[i];
      return {
        month,
        buyAndHold: Math.round(buyAndHoldResults[dayIndex] || buyAndHoldResults[buyAndHoldResults.length - 1]),
        autoFolio: Math.round(rebalancingResults[dayIndex] || rebalancingResults[rebalancingResults.length - 1])
      };
    });

    setSimulationData(chartData);
    setRebalancePoints(rebalances);
  };

  const totalAllocation = Object.values(allocations).reduce((sum, val) => sum + val, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 p-8" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      
      <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-400">AutoFolio</h1>
        <div className="flex items-center gap-4">
          {connected && onDashboard && (
            <button
              onClick={onDashboard}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-400/50 rounded-lg font-semibold transition flex items-center gap-2"
            >
              📊 My Portfolios
            </button>
          )}
          <WalletButton />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Orbitron:wght@700;900&display=swap');
        
        .jup-gradient { background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%); }
        .jup-gradient-text {
          background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .glow-text { text-shadow: 0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2); }
        .jup-card {
          background: rgba(20, 23, 31, 0.6);
          border: 1px solid rgba(34, 211, 238, 0.1);
          backdrop-filter: blur(20px);
        }
        .jup-card:hover {
          border-color: rgba(34, 211, 238, 0.3);
          box-shadow: 0 8px 32px rgba(34, 211, 238, 0.08);
        }
        input[type="range"] { -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer; width: 100%; }
        input[type="range"]::-webkit-slider-track {
          background: linear-gradient(90deg, rgba(34, 211, 238, 0.15) 0%, rgba(6, 182, 212, 0.25) 100%);
          height: 8px; border-radius: 4px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; height: 20px; width: 20px; border-radius: 50%;
          background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
          cursor: pointer; margin-top: -6px;
          box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.2); transition: all 0.2s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover { box-shadow: 0 0 0 6px rgba(34, 211, 238, 0.3); transform: scale(1.1); }
        input[type="range"]::-moz-range-track {
          background: linear-gradient(90deg, rgba(34, 211, 238, 0.15) 0%, rgba(6, 182, 212, 0.25) 100%);
          height: 8px; border-radius: 4px;
        }
        input[type="range"]::-moz-range-thumb {
          height: 20px; width: 20px; border-radius: 50%;
          background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
          cursor: pointer; border: none; box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.2);
        }
        .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex flex-col items-center justify-center text-center">
          <h1 className="text-7xl font-black mb-3 glow-text" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.1em' }}>
            <span className="text-cyan-400">AutoFolio</span>
          </h1>
          <p className="text-cyan-500 text-sm tracking-widest uppercase opacity-80">Set It. Forget It. Stay Balanced.</p>
          <p className="text-gray-400 text-xs mt-2">Automated Portfolio Rebalancing on Solana</p>
          <div className="mt-4 h-1 w-32 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
        </div>

        {/* Tab Navigation */}
        {connected && (
          <div className="flex gap-2 mb-6 max-w-7xl mx-auto">
            <button onClick={() => setActiveTab('simulate')}
              className={`px-6 py-3 rounded-xl font-semibold transition ${activeTab === 'simulate' ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-400' : 'bg-gray-800/50 text-gray-400 hover:text-gray-300'}`}>
              📊 Simulate Strategy
            </button>
            <button onClick={() => setActiveTab('create')}
              className={`px-6 py-3 rounded-xl font-semibold transition ${activeTab === 'create' ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-400' : 'bg-gray-800/50 text-gray-400 hover:text-gray-300'}`}>
              🔐 Create Real Portfolio
            </button>
          </div>
        )}

        {/* Create Portfolio */}
        {connected && activeTab === 'create' && (
          <div className="mb-12">
            <div className="jup-card rounded-2xl p-8 border-2 border-cyan-400/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-cyan-400 mb-2 flex items-center gap-2">
                    🔐 Your Real Portfolio
                    <span className="text-xs px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-full">DEMO MODE</span>
                  </h2>
                  <p className="text-sm text-gray-400">Create and manage your automated rebalancing portfolio (Simulation only - Real trading coming soon!)</p>
                </div>
                {walletBalances?.SOL && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Wallet Balance</div>
                    <div className="text-lg font-bold text-cyan-400">{walletBalances.SOL.balance?.toFixed(4)} SOL</div>
                  </div>
                )}
              </div>
              <PortfolioCreate presetTargets={getPresetTargets()} presetThreshold={presetStrategy?.threshold} presetName={presetStrategy?.name} />
            </div>
          </div>
        )}

        {/* Simulation */}
        {(!connected || activeTab === 'simulate') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="jup-card rounded-2xl p-6 transition-all duration-300">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span>Portfolio Builder</span>
              </h2>
              
              <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-xs text-cyan-300 leading-relaxed">
                  💡 <strong>Backtest Your Strategy:</strong> Uses real historical price data from the last 12 months to show how automated rebalancing would have performed.
                </p>
              </div>
              
              <div className="mb-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-300">Assets</span>
                  <button onClick={() => setIsAddingAsset(!isAddingAsset)}
                    className="text-xs px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded transition">+ Add</button>
                </div>
                
                {isAddingAsset && (
                  <div className="mt-2 p-2 bg-gray-900/50 rounded">
                    <input type="text" placeholder="Search..." value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white mb-2" />
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(availableAssets)
                        .filter(([symbol, data]) => 
                          !selectedAssets.includes(symbol) &&
                          (symbol.toLowerCase().includes(assetSearch.toLowerCase()) ||
                           data.name.toLowerCase().includes(assetSearch.toLowerCase()))
                        )
                        .map(([symbol, data]) => (
                          <button key={symbol}
                            onClick={() => {
                              setSelectedAssets([...selectedAssets, symbol]);
                              setAllocations({...allocations, [symbol]: 0});
                              setAssetSearch(''); setIsAddingAsset(false);
                            }}
                            className="w-full text-left px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-between">
                            <span className="text-white">{symbol} - {data.name}</span>
                            <span className="text-gray-500 text-xs">{data.type}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedAssets.map(asset => (
                    <div key={asset} className="px-2 py-1 bg-gray-700/50 rounded text-xs flex items-center gap-1">
                      <span style={{ color: assetColors[asset] }}>{asset}</span>
                      {selectedAssets.length > 2 && (
                        <button onClick={() => {
                            setSelectedAssets(selectedAssets.filter(a => a !== asset));
                            const newAllocations = {...allocations}; delete newAllocations[asset]; setAllocations(newAllocations);
                          }} className="text-red-400 hover:text-red-300 ml-1">×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-5">
                {assets.map(asset => (
                  <div key={asset}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-pulse-slow" style={{ backgroundColor: assetColors[asset] }}></div>
                        <label className="text-sm font-semibold" style={{ color: assetColors[asset] }}>{asset}</label>
                      </div>
                      <span className="text-lg font-bold jup-gradient-text">{allocations[asset]}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={allocations[asset]}
                      onChange={(e) => handleAllocationChange(asset, parseInt(e.target.value))} />
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-300">Rebalance Threshold</label>
                    <span className="text-lg font-bold jup-gradient-text">{deviationThreshold}%</span>
                  </div>
                  <input type="range" min="5" max="30" step="1" value={deviationThreshold}
                    onChange={(e) => setDeviationThreshold(parseInt(e.target.value))} />
                  <p className="text-xs text-gray-500 mt-2">
                    {deviationThreshold <= 10 && "🔥 Aggressive rebalancing"}
                    {deviationThreshold > 10 && deviationThreshold <= 20 && "⚖️ Balanced approach"}
                    {deviationThreshold > 20 && "🌙 Conservative drift"}
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-400">Total</span>
                  <span className={`text-2xl font-bold ${Math.abs(totalAllocation - 100) < 0.01 ? 'jup-gradient-text' : 'text-red-400'}`}>
                    {totalAllocation}%
                  </span>
                </div>
                
                <button onClick={runSimulation}
                  disabled={Math.abs(totalAllocation - 100) > 0.01 || loadingHistorical}
                  className="w-full jup-gradient disabled:opacity-30 disabled:cursor-not-allowed
                           text-[#0D0F14] font-bold py-4 px-6 rounded-xl transition-all duration-300
                           transform hover:scale-[1.02] active:scale-95 text-sm
                           shadow-lg shadow-cyan-400/20 disabled:shadow-none">
                  {loadingHistorical ? '⏳ Loading price data...' : Math.abs(totalAllocation - 100) > 0.01 ? '⚠ Adjust to 100%' : '✓ Run Backtest'}
                </button>

                {connected && simulationData && (
                  <button onClick={() => setActiveTab('create')}
                    className="w-full mt-3 py-3 px-6 rounded-xl font-bold text-sm bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 transition">
                    ✅ Happy with results? Create this portfolio →
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="jup-card rounded-2xl p-6 transition-all duration-300">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <span>Backtest Results (Last 12 Months)</span>
              </h2>
              {dataSource && simulationData && (
                <p className="text-xs text-gray-500 mb-4">{dataSource}</p>
              )}
              
              {!simulationData ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4 opacity-20">📈</div>
                    <p className="text-gray-400 text-base">Configure and run backtest</p>
                    <p className="text-gray-600 text-sm mt-1">Uses real historical prices from CoinGecko</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6 grid grid-cols-3 gap-3">
                    <div className="bg-[#0D0F14] border border-gray-800 rounded-xl p-4">
                      <div className="text-xs text-gray-500 mb-2">💰 Starting: $10,000</div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Buy & Hold</div>
                      <div className="text-2xl font-bold text-blue-400">
                        ${simulationData[simulationData.length - 1].buyAndHold.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {((simulationData[simulationData.length - 1].buyAndHold - 10000) / 10000 * 100) >= 0 ? '+' : ''}
                        {((simulationData[simulationData.length - 1].buyAndHold - 10000) / 10000 * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className={`bg-[#0D0F14] rounded-xl p-4 ${
                      simulationData[simulationData.length - 1].autoFolio > simulationData[simulationData.length - 1].buyAndHold 
                      ? 'border-2 border-cyan-400 shadow-lg shadow-cyan-400/20' : 'border border-cyan-500/30'
                    }`}>
                      <div className="text-xs text-gray-500 mb-2">💰 Starting: $10,000</div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-medium text-cyan-400">AutoFolio</div>
                        {simulationData[simulationData.length - 1].autoFolio > simulationData[simulationData.length - 1].buyAndHold && (
                          <span className="text-xs px-2 py-0.5 bg-cyan-400 text-black rounded-full font-bold">WINNER</span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-cyan-400">
                        ${simulationData[simulationData.length - 1].autoFolio.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {((simulationData[simulationData.length - 1].autoFolio - 10000) / 10000 * 100) >= 0 ? '+' : ''}
                        {((simulationData[simulationData.length - 1].autoFolio - 10000) / 10000 * 100).toFixed(1)}%
                      </div>
                      {simulationData[simulationData.length - 1].autoFolio > simulationData[simulationData.length - 1].buyAndHold && (
                        <div className="text-xs text-cyan-400 mt-2 font-semibold">
                          +${(simulationData[simulationData.length - 1].autoFolio - simulationData[simulationData.length - 1].buyAndHold).toLocaleString()} extra
                        </div>
                      )}
                    </div>
                    <div className="bg-[#0D0F14] border border-yellow-500/30 rounded-xl p-4">
                      <div className="text-xs text-gray-500 mb-2">⚙️ Active Strategy</div>
                      <div className="text-xs font-medium text-yellow-400 mb-1">Rebalances</div>
                      <div className="text-2xl font-bold text-yellow-400">{rebalancePoints.length}</div>
                      <div className="text-xs text-gray-500 mt-1">Triggered</div>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={simulationData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.3} />
                      <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: '#14171F', border: '1px solid rgba(34, 211, 238, 0.2)', borderRadius: '12px', fontSize: '12px' }}
                        formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                      <Legend />
                      <Line type="monotone" dataKey="buyAndHold" stroke="#60a5fa" strokeWidth={2} dot={false} name="Buy & Hold" />
                      <Line type="monotone" dataKey="autoFolio" stroke="#22d3ee" strokeWidth={3} dot={false} name="AutoFolio" />
                      {rebalancePoints.map((point, idx) => (
                        <ReferenceDot key={idx} x={point.month} y={point.value} r={5} fill="#fbbf24" stroke="#f59e0b" strokeWidth={2} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>

                  {rebalancePoints.length > 0 && (
                    <div className="mt-5 space-y-3">
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          <span className="text-yellow-400 font-semibold">{rebalancePoints.length} Rebalances</span>
                        </div>
                        <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                          {rebalancePoints.slice(0, 5).map((point, idx) => (
                            <div key={idx} className="text-xs text-gray-400">
                              <span className="text-yellow-400 font-semibold">{point.month}:</span>{' '}
                              {point.changes?.map((change, i) => (
                                <span key={i} className={change.action === 'SELL' ? 'text-red-400' : 'text-green-400'}>
                                  {change.action} {change.asset} ({change.from}%→{change.to}%)
                                  {i < point.changes.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          ))}
                          {rebalancePoints.length > 5 && (
                            <div className="text-xs text-gray-500 italic">+ {rebalancePoints.length - 5} more...</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        <div className="mt-6 bg-[#14171F]/40 border border-gray-800/50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-600">
            📊 {historicalPrices ? '✅ Real historical data (CoinGecko)' : loadingHistorical ? '⏳ Loading historical data...' : '🟡 Using fallback data'} • {realPrices ? '✅ Live prices' : '⏳ Loading...'} • Connect wallet to create real portfolio
          </p>
        </div>
      </div>
    </div>
  );
};

export default AutoFolio;
