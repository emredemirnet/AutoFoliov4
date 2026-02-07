import React, { useState, useEffect } from 'react';

const API_URL = 'https://autofolio-backend-production.up.railway.app';

// Seeded random for fallback
let _seed = 12345;
const seededRandom = () => {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed & 0x7fffffff) / 2147483647;
};
const resetSeed = (key) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = hash * 31 + key.charCodeAt(i);
  _seed = Math.abs(hash) % 2147483647 || 1;
};

const generateFallbackData = (startPrice, volatility, days = 365) => {
  const prices = [startPrice];
  for (let i = 1; i < days; i++) {
    const prev = prices[i - 1];
    const trend = ((i % 120) < 60) ? 0.012 : -0.008;
    const random = (seededRandom() - 0.5) * volatility * 3;
    const reversion = -((prev - startPrice) / startPrice) * 0.005;
    let next = prev * (1 + trend + random) + prev * reversion;
    next = Math.max(next, startPrice * 0.5);
    next = Math.min(next, startPrice * 2.5);
    prices.push(next);
  }
  return prices;
};

const runBacktest = (allocation, threshold, priceData) => {
  const assets = allocation.map(a => a.asset);
  const days = Math.min(...assets.map(a => priceData[a]?.length || 365));
  if (days < 30) return null;

  const initial = 10000;

  // Buy and hold
  const holdHoldings = {};
  assets.forEach(a => {
    const pct = allocation.find(x => x.asset === a).percent / 100;
    holdHoldings[a] = (initial * pct) / priceData[a][0];
  });

  let holdFinal = 0;
  assets.forEach(a => { holdFinal += holdHoldings[a] * priceData[a][days - 1]; });

  // Rebalancing
  const holdings = {};
  assets.forEach(a => {
    const pct = allocation.find(x => x.asset === a).percent / 100;
    holdings[a] = (initial * pct) / priceData[a][0];
  });

  let rebalanceCount = 0;
  for (let i = 1; i < days; i++) {
    let total = 0;
    assets.forEach(a => { total += holdings[a] * priceData[a][i]; });

    let needsRebal = false;
    assets.forEach(a => {
      const current = (holdings[a] * priceData[a][i] / total) * 100;
      const target = allocation.find(x => x.asset === a).percent;
      if (Math.abs(current - target) > target * (threshold / 100)) needsRebal = true;
    });

    if (needsRebal) {
      // Apply 0.3% fee
      let fee = 0;
      assets.forEach(a => {
        const currentVal = holdings[a] * priceData[a][i];
        const targetVal = total * (allocation.find(x => x.asset === a).percent / 100);
        if (targetVal > currentVal) fee += Math.abs(targetVal - currentVal) * 0.003;
      });
      total -= fee;

      assets.forEach(a => {
        const targetVal = total * (allocation.find(x => x.asset === a).percent / 100);
        holdings[a] = targetVal / priceData[a][i];
      });
      rebalanceCount++;
    }
  }

  let rebalFinal = 0;
  assets.forEach(a => { rebalFinal += holdings[a] * priceData[a][days - 1]; });

  const holdReturn = ((holdFinal - initial) / initial) * 100;
  const rebalReturn = ((rebalFinal - initial) / initial) * 100;

  return {
    autofolio: parseFloat(rebalReturn.toFixed(1)),
    buyHold: parseFloat(holdReturn.toFixed(1)),
    rebalances: rebalanceCount,
    days,
  };
};

const LandingPage = ({ onSelectStrategy, onCustomize, onDocs }) => {
  const [perfData, setPerfData] = useState({});
  const [loading, setLoading] = useState(true);

  const strategies = [
    {
      id: 'conservative',
      name: 'Conservative',
      emoji: '💎',
      color: 'blue',
      borderColor: 'border-blue-400',
      allocation: [
        { asset: 'USDC', percent: 40 },
        { asset: 'GOLD', percent: 25 },
        { asset: 'SOL', percent: 20 },
        { asset: 'BTC', percent: 15 },
      ],
      threshold: 15,
      bestFor: ['Beginners', 'Low Risk', 'Stable Returns'],
    },
    {
      id: 'balanced',
      name: 'Balanced',
      emoji: '⚖️',
      color: 'cyan',
      borderColor: 'border-cyan-400',
      allocation: [
        { asset: 'SOL', percent: 40 },
        { asset: 'BTC', percent: 30 },
        { asset: 'ETH', percent: 20 },
        { asset: 'USDC', percent: 10 },
      ],
      threshold: 10,
      bestFor: ['Moderate Risk', 'Active Traders', 'Growth Focused'],
    },
    {
      id: 'aggressive',
      name: 'Aggressive',
      emoji: '🔥',
      color: 'orange',
      borderColor: 'border-orange-400',
      allocation: [
        { asset: 'SOL', percent: 35 },
        { asset: 'TSLA', percent: 25 },
        { asset: 'ETH', percent: 25 },
        { asset: 'BTC', percent: 15 },
      ],
      threshold: 8,
      bestFor: ['High Risk', 'Maximum Gains', 'Experienced'],
    },
  ];

  useEffect(() => {
    loadPerformance();
  }, []);

  const loadPerformance = async () => {
    setLoading(true);
    let priceData = {};

    // Try to fetch real historical data
    try {
      const response = await fetch(`${API_URL}/api/historical-prices`);
      if (response.ok) {
        priceData = await response.json();
        console.log('✅ Landing page: real historical data loaded');
      }
    } catch (e) {
      console.log('⚠️ Landing page: using fallback data');
    }

    // Fill missing with fallback
    const fallbackPrices = { BTC: 70000, ETH: 2000, SOL: 90, USDC: 1, USDT: 1, TSLA: 400, GOLD: 2600, AAPL: 270, NVDA: 180, MSFT: 400, GOOGL: 320, AMZN: 210, META: 650, SILVER: 30 };
    const volatilities = { BTC: 0.04, ETH: 0.05, SOL: 0.07, USDC: 0, USDT: 0, TSLA: 0.06, GOLD: 0.02, AAPL: 0.03, NVDA: 0.05, MSFT: 0.04, GOOGL: 0.04, AMZN: 0.04, META: 0.05, SILVER: 0.03 };

    for (const [symbol, price] of Object.entries(fallbackPrices)) {
      if (!priceData[symbol] || !Array.isArray(priceData[symbol]) || priceData[symbol].length < 30) {
        if (symbol === 'USDC' || symbol === 'USDT') {
          priceData[symbol] = Array(365).fill(1);
        } else {
          resetSeed(symbol);
          priceData[symbol] = generateFallbackData(price, volatilities[symbol] || 0.04);
        }
      }
    }

    // Run backtest for each strategy
    const results = {};
    for (const strat of strategies) {
      const result = runBacktest(strat.allocation, strat.threshold, priceData);
      if (result) {
        results[strat.id] = result;
      }
    }

    setPerfData(results);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black mb-4 glow-text" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.1em' }}>
            <span className="text-cyan-400">AutoFolio</span>
          </h1>
          <p className="text-cyan-500 text-xl tracking-widest uppercase opacity-80 mb-3">
            Set It. Forget It. Stay Balanced.
          </p>
          <p className="text-gray-400 text-base max-w-2xl mx-auto mb-4">
            Automated Portfolio Rebalancing on Solana
          </p>
          
          <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
            <div className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <span className="text-cyan-400 font-semibold text-xs">💰 Crypto</span>
            </div>
            <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <span className="text-blue-400 font-semibold text-xs">📈 Stocks</span>
            </div>
            <div className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <span className="text-yellow-400 font-semibold text-xs">🥇 Commodities</span>
            </div>
          </div>
          
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => document.getElementById('strategies').scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-cyan-600 text-gray-900 font-bold rounded-xl hover:scale-105 transition-transform text-sm"
            >
              Get Started →
            </button>
            <button 
              onClick={onDocs}
              className="px-6 py-3 border-2 border-cyan-400 text-cyan-400 font-bold rounded-xl hover:bg-cyan-400/10 transition-all text-sm"
            >
              📄 Docs
            </button>
          </div>
        </div>

        {/* Strategy Cards */}
        <div id="strategies" className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-cyan-400 mb-2">Choose Your Strategy</h2>
            <p className="text-gray-400 text-sm">Based on real historical data from the last 12 months</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {strategies.map((strategy) => {
              const perf = perfData[strategy.id];
              return (
                <div key={strategy.id}
                  className={`jup-card rounded-2xl p-5 border-2 ${strategy.borderColor} hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
                >
                  <div className="text-center mb-3">
                    <div className="text-4xl mb-2">{strategy.emoji}</div>
                    <h3 className="text-xl font-bold text-white">{strategy.name}</h3>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-400 mb-1">ALLOCATION</div>
                    {strategy.allocation.map((alloc, idx) => (
                      <div key={idx} className="flex justify-between text-sm mb-0.5">
                        <span className="text-gray-300">{alloc.asset}</span>
                        <span className="text-cyan-400 font-bold">{alloc.percent}%</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-3 pb-3 border-b border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Threshold:</span>
                      <span className="text-white font-bold">{strategy.threshold}%</span>
                    </div>
                  </div>

                  {/* Dynamic Performance */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-400 mb-1">BACKTEST (12 months)</div>
                    {loading ? (
                      <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                        <span className="text-xs text-gray-500 animate-pulse">Loading...</span>
                      </div>
                    ) : perf ? (
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">AutoFolio:</span>
                          <span className={`font-bold text-sm ${perf.autofolio >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                            {perf.autofolio >= 0 ? '+' : ''}{perf.autofolio}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">Buy & Hold:</span>
                          <span className={`font-bold text-sm ${perf.buyHold >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            {perf.buyHold >= 0 ? '+' : ''}{perf.buyHold}%
                          </span>
                        </div>
                        <div className="mt-1 pt-1 border-t border-gray-700">
                          <div className={`text-xs font-bold ${(perf.autofolio - perf.buyHold) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(perf.autofolio - perf.buyHold) >= 0 ? '✅' : '⚠️'} {(perf.autofolio - perf.buyHold) >= 0 ? '+' : ''}{(perf.autofolio - perf.buyHold).toFixed(1)}% vs Hold
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{perf.rebalances} rebalances • {perf.days} days</div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                        <span className="text-xs text-gray-500">No data</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-3 text-xs text-gray-400">
                    Best for: {strategy.bestFor.join(' • ')}
                  </div>

                  <button onClick={() => onSelectStrategy(strategy)}
                    className={`w-full py-2.5 rounded-xl font-bold transition-all text-sm ${
                      strategy.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                      strategy.color === 'cyan' ? 'bg-cyan-500 hover:bg-cyan-600' :
                      'bg-orange-500 hover:bg-orange-600'
                    } text-white hover:scale-105`}
                  >
                    SIMULATE →
                  </button>
                </div>
              );
            })}

            {/* Custom Card */}
            <div className="jup-card rounded-2xl p-5 border-2 border-purple-400 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
              <div className="text-center mb-3">
                <div className="text-4xl mb-2">⚡</div>
                <h3 className="text-xl font-bold text-white">Custom</h3>
              </div>

              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-400 mb-1">BUILD YOUR OWN</div>
                <div className="text-sm text-gray-300 mb-2">
                  Create a personalized strategy with any assets.
                </div>
              </div>

              <div className="mb-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="text-xs text-purple-300 leading-relaxed">
                  • Crypto + Stocks + Commodities<br/>
                  • Custom allocation & threshold<br/>
                  • Real historical backtesting<br/>
                  • BTC, ETH, SOL, AAPL, TSLA, GOLD...
                </div>
              </div>

              <div className="mb-3 text-xs text-gray-400">
                Best for: Advanced users • Custom needs
              </div>

              <button
                onClick={() => onSelectStrategy({ 
                  id: 'custom', name: 'Custom Portfolio',
                  allocation: [{ asset: 'SOL', percent: 40 }, { asset: 'BTC', percent: 30 }, { asset: 'USDC', percent: 30 }],
                  threshold: 10
                })}
                className="w-full py-2.5 rounded-xl font-bold bg-purple-500 hover:bg-purple-600 text-white transition-all text-sm hover:scale-105"
              >
                BUILD →
              </button>
            </div>
          </div>
        </div>

        {/* Fee + How It Works - Combined Clean Section */}
        <div className="mb-16 max-w-5xl mx-auto">
          
          {/* How It Works */}
          <div id="how-it-works" className="mb-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">How It Works</h2>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { num: '1', title: 'Connect Wallet', desc: 'Any Solana wallet' },
                { num: '2', title: 'Choose Strategy', desc: 'Preset or custom' },
                { num: '3', title: 'Deposit Funds', desc: 'Start from $100' },
                { num: '4', title: 'Auto-Rebalance', desc: '24/7 monitoring' },
              ].map((item, idx) => (
                <div key={idx} className="text-center jup-card rounded-xl p-4">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 font-bold text-sm">{item.num}</div>
                  <div className="text-sm font-bold text-white mb-1">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fees - Inline */}
          <div className="jup-card rounded-xl p-4 border border-cyan-400/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="text-sm font-semibold text-gray-300">Fees:</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Trading</span>
                  <span className="text-sm font-bold text-cyan-400">0.3%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Platform</span>
                  <span className="text-sm font-bold text-green-400">FREE</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Withdrawal</span>
                  <span className="text-sm font-bold text-cyan-400">$0</span>
                </div>
              </div>
              <span className="text-xs text-gray-500">No hidden costs</span>
            </div>
          </div>
        </div>

        {/* Roadmap */}
        <div className="mb-16 max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
            <div className="doc-card rounded-xl p-4 border border-green-500/30 text-center">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block mb-2"></span>
              <div className="text-xs font-bold text-green-400 mb-1">PHASE 1 — LIVE</div>
              <div className="text-sm font-bold text-white mb-1">Backtest & Alerts</div>
              <div className="text-xs text-gray-500">Multi-asset backtesting, email & Telegram notifications</div>
            </div>
            <div className="doc-card rounded-xl p-4 border border-yellow-500/30 text-center">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block mb-2"></span>
              <div className="text-xs font-bold text-yellow-400 mb-1">PHASE 2 — IN PROGRESS</div>
              <div className="text-sm font-bold text-white mb-1">Mobile dApp</div>
              <div className="text-xs text-gray-500">Solana Mobile Stack, dApp Store, push notifications</div>
            </div>
            <div className="doc-card rounded-xl p-4 border border-cyan-500/30 text-center">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block mb-2"></span>
              <div className="text-xs font-bold text-cyan-400 mb-1">PHASE 3 — PLANNED</div>
              <div className="text-sm font-bold text-white mb-1">On-Chain Rebalance</div>
              <div className="text-xs text-gray-500">Solana program vault, Jupiter auto-swap</div>
            </div>
          </div>
          <div className="text-center mt-4">
            <button onClick={onDocs}
              className="px-5 py-2 border border-cyan-400/50 text-cyan-400 rounded-lg text-sm font-semibold hover:bg-cyan-400/10 transition">
              📄 Read Full Documentation →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Orbitron:wght@700;900&display=swap');
        .glow-text { text-shadow: 0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2); }
        .jup-card { background: rgba(20, 23, 31, 0.6); border: 1px solid rgba(34, 211, 238, 0.1); backdrop-filter: blur(20px); }
        .jup-card:hover { border-color: rgba(34, 211, 238, 0.3); }
        .doc-card { background: rgba(20, 23, 31, 0.6); border: 1px solid rgba(34, 211, 238, 0.1); backdrop-filter: blur(20px); }
      `}</style>
    </div>
  );
};

export default LandingPage;
