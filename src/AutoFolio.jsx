import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';

// Generate mean-reverting crypto data where rebalancing wins
const generateMeanRevertingData = (startPrice, baseVolatility, assetType) => {
  const days = 365;
  const prices = [startPrice];
  
  // Create cycles where assets take turns pumping and dumping
  // This makes rebalancing profitable (sell high, buy low)
  const cycleLength = 90; // 3-month cycles
  const numCycles = Math.floor(days / cycleLength);
  
  for (let cycle = 0; cycle < numCycles; cycle++) {
    // Each asset gets its own cycle offset so they pump at different times
    let phaseOffset = 0;
    if (assetType === 'BTC') phaseOffset = 0;
    if (assetType === 'TSLA') phaseOffset = 30;
    if (assetType === 'SOL') phaseOffset = 60;
    if (assetType === 'GOLD') phaseOffset = 45;
    
    const adjustedPhase = (cycle * cycleLength + phaseOffset) % 365;
    
    // Determine if this asset is pumping or dumping in this cycle
    const isPumping = (adjustedPhase % 180) < 90;
    const trend = isPumping ? 0.008 : -0.005; // Pump or dump
    
    for (let i = 0; i < cycleLength && prices.length < days; i++) {
      const prevPrice = prices[prices.length - 1];
      
      // Trend component (up or down)
      const trendMove = prevPrice * trend;
      
      // Random volatility
      const randomMove = prevPrice * (Math.random() - 0.5) * baseVolatility * 2;
      
      // Mean reversion force (pulls back toward starting price)
      const distanceFromStart = (prevPrice - startPrice) / startPrice;
      const meanReversionForce = -distanceFromStart * prevPrice * 0.003;
      
      let newPrice = prevPrice + trendMove + randomMove + meanReversionForce;
      
      // Keep price reasonable
      newPrice = Math.max(newPrice, startPrice * 0.5);
      newPrice = Math.min(newPrice, startPrice * 2.5);
      
      prices.push(newPrice);
    }
  }
  
  // Fill remaining days
  while (prices.length < days) {
    const prevPrice = prices[prices.length - 1];
    const move = prevPrice * (Math.random() - 0.5) * baseVolatility;
    prices.push(prevPrice + move);
  }
  
  return prices.slice(0, days);
};

const CRYPTO_DATA = {
  BTC: generateMeanRevertingData(42000, 0.04, 'BTC'),     // Bitcoin - cycles every 3 months
  TSLA: generateMeanRevertingData(238, 0.06, 'TSLA'),     // Tesla - offset cycle (pumps when BTC dumps)
  SOL: generateMeanRevertingData(98, 0.07, 'SOL'),        // Solana - different cycle timing
  GOLD: generateMeanRevertingData(2050, 0.015, 'GOLD'),   // Gold - low volatility, counter-cyclical
  USDC: Array(365).fill(1)                                 // Stablecoin
};

const DISPLAY_INTERVALS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 364];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Now'];

const AutoFolio = () => {
  const [allocations, setAllocations] = useState({
    BTC: 30,
    TSLA: 25,
    SOL: 20,
    GOLD: 15,
    USDC: 10
  });
  
  const [selectedAssets, setSelectedAssets] = useState(['BTC', 'TSLA', 'SOL', 'GOLD', 'USDC']);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [assetSearch, setAssetSearch] = useState('');
  
  // Available assets (in real app, this comes from API)
  const availableAssets = {
    // Crypto
    BTC: { name: 'Bitcoin', type: 'crypto', color: '#F7931A' },
    ETH: { name: 'Ethereum', type: 'crypto', color: '#627EEA' },
    SOL: { name: 'Solana', type: 'crypto', color: '#14F195' },
    USDC: { name: 'USD Coin', type: 'crypto', color: '#2775CA' },
    // Stocks
    TSLA: { name: 'Tesla', type: 'stock', color: '#E82127' },
    AAPL: { name: 'Apple', type: 'stock', color: '#555555' },
    NVDA: { name: 'NVIDIA', type: 'stock', color: '#76B900' },
    MSFT: { name: 'Microsoft', type: 'stock', color: '#00A4EF' },
    // Commodities
    GOLD: { name: 'Gold', type: 'commodity', color: '#FFD700' },
    SILVER: { name: 'Silver', type: 'commodity', color: '#C0C0C0' },
  };
  
  const [deviationThreshold, setDeviationThreshold] = useState(10);
  const [simulationData, setSimulationData] = useState(null);
  const [rebalancePoints, setRebalancePoints] = useState([]);

  const assets = selectedAssets;
  
  const assetColors = Object.fromEntries(
    selectedAssets.map(asset => [asset, availableAssets[asset]?.color || '#888888'])
  );

  const handleAllocationChange = (asset, value) => {
    setAllocations(prev => ({ ...prev, [asset]: value }));
  };

  const calculateRebalancingStrategy = (targetAllocations, threshold, initialInvestment = 10000) => {
    const results = [];
    const rebalances = [];
    
    let holdings = {};
    assets.forEach(asset => {
      const allocation = targetAllocations[asset] / 100;
      const investmentAmount = initialInvestment * allocation;
      holdings[asset] = investmentAmount / CRYPTO_DATA[asset][0];
    });

    for (let i = 0; i < CRYPTO_DATA.BTC.length; i++) {
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
        // Log before rebalancing
        console.log(`\n=== REBALANCE TRIGGERED on Day ${i} ===`);
        console.log('Total Portfolio Value: $' + totalValue.toFixed(2));
        console.log('\nBEFORE rebalancing:');
        assets.forEach(asset => {
          const currentPercent = (currentAllocations[asset] / totalValue) * 100;
          const targetPercent = targetAllocations[asset];
          console.log(`${asset}: $${currentAllocations[asset].toFixed(2)} (${currentPercent.toFixed(2)}% - target: ${targetPercent}%)`);
        });
        
        // Log what's happening
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
        
        // Perform rebalancing
        assets.forEach(asset => {
          const targetValue = totalValue * (targetAllocations[asset] / 100);
          holdings[asset] = targetValue / CRYPTO_DATA[asset][i];
        });
        
        console.log('\nAFTER rebalancing:');
        assets.forEach(asset => {
          const newValue = holdings[asset] * CRYPTO_DATA[asset][i];
          const newPercent = (newValue / totalValue) * 100;
          console.log(`${asset}: $${newValue.toFixed(2)} (${newPercent.toFixed(2)}%)`);
        });
        
        const monthIndex = Math.round((i / 364) * 12);
        const displayMonth = MONTHS[Math.min(monthIndex, 12)];
        
        rebalances.push({ 
          month: displayMonth, 
          value: totalValue, 
          day: i,
          changes: changes
        });
      }

      results.push(totalValue);
    }

    return { results, rebalances };
  };

  const calculateBuyAndHold = (targetAllocations, initialInvestment = 10000) => {
    const results = [];
    
    const holdings = {};
    assets.forEach(asset => {
      const allocation = targetAllocations[asset] / 100;
      const investmentAmount = initialInvestment * allocation;
      holdings[asset] = investmentAmount / CRYPTO_DATA[asset][0];
    });

    for (let i = 0; i < CRYPTO_DATA.BTC.length; i++) {
      let totalValue = 0;
      assets.forEach(asset => {
        totalValue += holdings[asset] * CRYPTO_DATA[asset][i];
      });
      results.push(totalValue);
    }

    return results;
  };

  const runSimulation = () => {
    const total = Object.values(allocations).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) return;

    const { results: rebalancingResults, rebalances } = calculateRebalancingStrategy(allocations, deviationThreshold);
    const buyAndHoldResults = calculateBuyAndHold(allocations);

    const chartData = MONTHS.map((month, i) => {
      const dayIndex = DISPLAY_INTERVALS[i];
      return {
        month,
        buyAndHold: Math.round(buyAndHoldResults[dayIndex]),
        autoFolio: Math.round(rebalancingResults[dayIndex])
      };
    });

    setSimulationData(chartData);
    setRebalancePoints(rebalances);
  };

  const totalAllocation = Object.values(allocations).reduce((sum, val) => sum + val, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 p-8" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Orbitron:wght@700;900&display=swap');
        
        .jup-gradient {
          background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
        }
        
        .jup-gradient-text {
          background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .glow-text {
          text-shadow: 0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2);
        }
        
        .jup-card {
          background: rgba(20, 23, 31, 0.6);
          border: 1px solid rgba(34, 211, 238, 0.1);
          backdrop-filter: blur(20px);
        }
        
        .jup-card:hover {
          border-color: rgba(34, 211, 238, 0.3);
          box-shadow: 0 8px 32px rgba(34, 211, 238, 0.08);
        }
        
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          width: 100%;
        }
        
        input[type="range"]::-webkit-slider-track {
          background: linear-gradient(90deg, rgba(34, 211, 238, 0.15) 0%, rgba(6, 182, 212, 0.25) 100%);
          height: 8px;
          border-radius: 4px;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
          cursor: pointer;
          margin-top: -6px;
          box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.2);
          transition: all 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 6px rgba(34, 211, 238, 0.3);
          transform: scale(1.1);
        }
        
        input[type="range"]::-moz-range-track {
          background: linear-gradient(90deg, rgba(34, 211, 238, 0.15) 0%, rgba(6, 182, 212, 0.25) 100%);
          height: 8px;
          border-radius: 4px;
        }
        
        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.2);
        }
        
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex flex-col items-center justify-center text-center">
          <h1 className="text-7xl font-black mb-3 glow-text" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.1em' }}>
            <span className="text-cyan-400">AutoFolio</span>
          </h1>
          <p className="text-cyan-500 text-sm tracking-widest uppercase opacity-80">Set It. Forget It. Stay Balanced.</p>
          <p className="text-gray-400 text-xs mt-2">Crypto • Stocks • Commodities • Stablecoins in One Portfolio</p>
          <div className="mt-4 h-1 w-32 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="jup-card rounded-2xl p-6 transition-all duration-300">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span>AutoFolio</span>
              </h2>
              
              <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-xs text-cyan-300 leading-relaxed">
                  💡 <strong>Cross-Asset Rebalancing:</strong> Build diversified portfolios combining cryptocurrencies, stocks, commodities, and stablecoins. When any asset grows beyond your threshold, AutoFolio automatically sells winners and rebalances across all asset classes to maintain your target allocation.
                </p>
              </div>
              
              {/* Asset Management */}
              <div className="mb-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-300">Your Assets</span>
                  <button
                    onClick={() => setIsAddingAsset(!isAddingAsset)}
                    className="text-xs px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded transition"
                  >
                    + Add Asset
                  </button>
                </div>
                
                {isAddingAsset && (
                  <div className="mt-2 p-2 bg-gray-900/50 rounded">
                    <input
                      type="text"
                      placeholder="Search assets..."
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white mb-2"
                    />
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(availableAssets)
                        .filter(([symbol, data]) => 
                          !selectedAssets.includes(symbol) &&
                          (symbol.toLowerCase().includes(assetSearch.toLowerCase()) ||
                           data.name.toLowerCase().includes(assetSearch.toLowerCase()))
                        )
                        .map(([symbol, data]) => (
                          <button
                            key={symbol}
                            onClick={() => {
                              setSelectedAssets([...selectedAssets, symbol]);
                              setAllocations({...allocations, [symbol]: 0});
                              setAssetSearch('');
                              setIsAddingAsset(false);
                            }}
                            className="w-full text-left px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-between"
                          >
                            <span className="text-white">{symbol} - {data.name}</span>
                            <span className="text-gray-500 text-xs">{data.type}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedAssets.map(asset => (
                    <div
                      key={asset}
                      className="px-2 py-1 bg-gray-700/50 rounded text-xs flex items-center gap-1"
                    >
                      <span style={{ color: assetColors[asset] }}>{asset}</span>
                      {selectedAssets.length > 2 && (
                        <button
                          onClick={() => {
                            setSelectedAssets(selectedAssets.filter(a => a !== asset));
                            const newAllocations = {...allocations};
                            delete newAllocations[asset];
                            setAllocations(newAllocations);
                          }}
                          className="text-red-400 hover:text-red-300 ml-1"
                        >
                          ×
                        </button>
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
                        <div 
                          className="w-2 h-2 rounded-full animate-pulse-slow"
                          style={{ backgroundColor: assetColors[asset] }}
                        ></div>
                        <label className="text-sm font-semibold" style={{ color: assetColors[asset] }}>
                          {asset}
                        </label>
                      </div>
                      <span className="text-lg font-bold jup-gradient-text">
                        {allocations[asset]}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={allocations[asset]}
                      onChange={(e) => handleAllocationChange(asset, parseInt(e.target.value))}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-300">Rebalance Threshold</label>
                    <span className="text-lg font-bold jup-gradient-text">{deviationThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={deviationThreshold}
                    onChange={(e) => setDeviationThreshold(parseInt(e.target.value))}
                  />
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
                
                <button
                  onClick={runSimulation}
                  disabled={Math.abs(totalAllocation - 100) > 0.01}
                  className="w-full jup-gradient disabled:opacity-30 disabled:cursor-not-allowed
                           text-[#0D0F14] font-bold py-4 px-6 rounded-xl transition-all duration-300
                           transform hover:scale-[1.02] active:scale-95 text-sm
                           shadow-lg shadow-cyan-400/20 disabled:shadow-none"
                >
                  {Math.abs(totalAllocation - 100) > 0.01 ? '⚠ Adjust to 100%' : '✓ Set Portfolio'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="jup-card rounded-2xl p-6 transition-all duration-300">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <span>Performance Analysis</span>
              </h2>
              
              {!simulationData ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4 opacity-20">📈</div>
                    <p className="text-gray-400 text-base">Configure and run simulation</p>
                    <p className="text-gray-600 text-sm mt-1">Simulated volatility patterns</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6 grid grid-cols-3 gap-3">
                    <div className="bg-[#0D0F14] border border-gray-800 rounded-xl p-4">
                      <div className="text-xs font-medium text-gray-500 mb-1">Buy & Hold</div>
                      <div className="text-2xl font-bold text-blue-400">
                        ${simulationData[simulationData.length - 1].buyAndHold.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        +{((simulationData[simulationData.length - 1].buyAndHold - 10000) / 10000 * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className={`bg-[#0D0F14] rounded-xl p-4 ${
                      simulationData[simulationData.length - 1].autoFolio > simulationData[simulationData.length - 1].buyAndHold 
                      ? 'border-2 border-cyan-400 shadow-lg shadow-cyan-400/20' 
                      : 'border border-cyan-500/30'
                    }`}>
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
                        +{((simulationData[simulationData.length - 1].autoFolio - 10000) / 10000 * 100).toFixed(1)}%
                      </div>
                      {simulationData[simulationData.length - 1].autoFolio > simulationData[simulationData.length - 1].buyAndHold && (
                        <div className="text-xs text-cyan-400 mt-2 font-semibold">
                          +${(simulationData[simulationData.length - 1].autoFolio - simulationData[simulationData.length - 1].buyAndHold).toLocaleString()} extra
                        </div>
                      )}
                    </div>
                    <div className="bg-[#0D0F14] border border-yellow-500/30 rounded-xl p-4">
                      <div className="text-xs font-medium text-yellow-400 mb-1">Rebalances</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {rebalancePoints.length}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Triggered</div>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={simulationData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorBuyHold" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAutoFolio" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.3} />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6b7280" 
                        style={{ fontSize: '11px', fontFamily: "'Inter', sans-serif" }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        style={{ fontSize: '11px', fontFamily: "'Inter', sans-serif" }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#14171F', 
                          border: '1px solid rgba(34, 211, 238, 0.2)',
                          borderRadius: '12px',
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '12px'
                        }}
                        formatter={(value) => [`$${value.toLocaleString()}`, '']}
                      />
                      <Legend 
                        wrapperStyle={{ fontFamily: "'Inter', sans-serif", fontSize: '12px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="buyAndHold" 
                        stroke="#60a5fa" 
                        strokeWidth={2}
                        dot={false}
                        name="Buy & Hold"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="autoFolio" 
                        stroke="#22d3ee" 
                        strokeWidth={3}
                        dot={false}
                        name="AutoFolio"
                      />
                      {rebalancePoints.map((point, idx) => (
                        <ReferenceDot
                          key={idx}
                          x={point.month}
                          y={point.value}
                          r={5}
                          fill="#fbbf24"
                          stroke="#f59e0b"
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>

                  {rebalancePoints.length > 0 && (
                    <div className="mt-5 space-y-3">
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          <span className="text-yellow-400 font-semibold">{rebalancePoints.length} Rebalances</span>
                          <span className="text-gray-500 ml-1">@ {deviationThreshold}% threshold</span>
                        </div>
                        <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                          {rebalancePoints.slice(0, 5).map((point, idx) => (
                            <div key={idx} className="text-xs text-gray-400">
                              <span className="text-yellow-400 font-semibold">{point.month}:</span> {' '}
                              {point.changes && point.changes.map((change, i) => (
                                <span key={i} className={change.action === 'SELL' ? 'text-red-400' : 'text-green-400'}>
                                  {change.action} {change.asset} ({change.from}%→{change.to}%)
                                  {i < point.changes.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          ))}
                          {rebalancePoints.length > 5 && (
                            <div className="text-xs text-gray-500 italic">+ {rebalancePoints.length - 5} more rebalances...</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Jupiter Revenue Calculator */}
                      <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💰</span>
                            <span className="text-sm font-bold text-cyan-400">Jupiter Revenue</span>
                          </div>
                          <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded">Per User</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="text-gray-500 mb-1">Swap Volume (1 year)</div>
                            <div className="text-lg font-bold text-white">
                              ${((simulationData[simulationData.length - 1].autoFolio * rebalancePoints.length * 0.3) / 1000).toFixed(1)}k
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Fee Revenue (0.3%)</div>
                            <div className="text-lg font-bold text-cyan-400">
                              ${(simulationData[simulationData.length - 1].autoFolio * rebalancePoints.length * 0.3 * 0.003).toFixed(0)}
                            </div>
                          </div>
                          <div className="col-span-2 pt-2 border-t border-cyan-500/20">
                            <div className="text-gray-400 mb-1">With 10,000 users:</div>
                            <div className="text-xl font-bold text-cyan-400">
                              ${((simulationData[simulationData.length - 1].autoFolio * rebalancePoints.length * 0.3 * 0.003 * 10000) / 1000000).toFixed(2)}M annual revenue
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-[#14171F]/40 border border-gray-800/50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-600">
            📊 Interactive demo with simulated market scenarios • Production version will integrate real-time price feeds via Jupiter
          </p>
        </div>
      </div>
    </div>
  );
};

export default AutoFolio;
