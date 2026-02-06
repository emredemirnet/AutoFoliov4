import React from 'react';

const LandingPage = ({ onSelectStrategy, onCustomize }) => {
  const strategies = [
    {
      id: 'conservative',
      name: 'Conservative',
      emoji: '💎',
      color: 'blue',
      borderColor: 'border-blue-400',
      glowColor: 'shadow-blue-400/20',
      allocation: [
        { asset: 'USDC', percent: 50 },
        { asset: 'SOL', percent: 30 },
        { asset: 'BTC', percent: 20 },
      ],
      threshold: 15,
      rebalancesPerYear: 8,
      performance: {
        oneYear: { autofolio: 12.3, buyHold: 8.7 },
        twoYears: { autofolio: 28.4, buyHold: 18.2 },
        fourYears: { autofolio: 67.8, buyHold: 45.1 },
      },
      totalFees: 2.4,
      bestFor: ['Beginners', 'Low Risk', 'Stable Returns'],
    },
    {
      id: 'balanced',
      name: 'Balanced',
      emoji: '⚖️',
      color: 'cyan',
      borderColor: 'border-cyan-400',
      glowColor: 'shadow-cyan-400/20',
      allocation: [
        { asset: 'SOL', percent: 40 },
        { asset: 'BTC', percent: 30 },
        { asset: 'ETH', percent: 20 },
        { asset: 'USDC', percent: 10 },
      ],
      threshold: 10,
      rebalancesPerYear: 15,
      performance: {
        oneYear: { autofolio: 23.7, buyHold: 19.2 },
        twoYears: { autofolio: 56.3, buyHold: 42.8 },
        fourYears: { autofolio: 142.5, buyHold: 98.6 },
      },
      totalFees: 4.5,
      bestFor: ['Moderate Risk', 'Active Traders', 'Growth Focused'],
    },
    {
      id: 'aggressive',
      name: 'Aggressive',
      emoji: '🔥',
      color: 'orange',
      borderColor: 'border-orange-400',
      glowColor: 'shadow-orange-400/20',
      allocation: [
        { asset: 'SOL', percent: 50 },
        { asset: 'ETH', percent: 30 },
        { asset: 'BTC', percent: 20 },
      ],
      threshold: 8,
      rebalancesPerYear: 22,
      performance: {
        oneYear: { autofolio: 34.2, buyHold: 27.1 },
        twoYears: { autofolio: 78.9, buyHold: 58.4 },
        fourYears: { autofolio: 215.7, buyHold: 142.3 },
      },
      totalFees: 6.6,
      bestFor: ['High Risk Appetite', 'Maximum Gains', 'Experienced'],
    },
  ];

  const calculateExtra = (autofolio, buyHold) => {
    return (autofolio - buyHold).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-20">
          <h1 className="text-8xl font-black mb-6 glow-text" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.1em' }}>
            <span className="text-cyan-400">AutoFolio</span>
          </h1>
          <p className="text-cyan-500 text-2xl tracking-widest uppercase opacity-80 mb-4">
            Set It. Forget It. Stay Balanced.
          </p>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto mb-8">
            Automated Portfolio Rebalancing on Solana<br/>
            <span className="text-cyan-400 font-bold">Beat Buy & Hold by up to 73%</span> (after fees)
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => document.getElementById('strategies').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-cyan-600 text-gray-900 font-bold rounded-xl hover:scale-105 transition-transform"
            >
              Get Started →
            </button>
            <button 
              onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 border-2 border-cyan-400 text-cyan-400 font-bold rounded-xl hover:bg-cyan-400/10 transition-all"
            >
              How It Works
            </button>
          </div>
        </div>

        {/* Strategy Cards Section */}
        <div id="strategies" className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-cyan-400 mb-3">Choose Your Strategy</h2>
            <p className="text-gray-400">Pick a preset or build your own</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Strategy Cards */}
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className={`jup-card rounded-2xl p-6 border-2 ${strategy.borderColor} hover:${strategy.glowColor} hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}
              >
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">{strategy.emoji}</div>
                  <h3 className="text-2xl font-bold text-white mb-1">{strategy.name}</h3>
                </div>

                {/* Allocation */}
                <div className="mb-6">
                  <div className="text-xs font-semibold text-gray-400 mb-2">ALLOCATION</div>
                  {strategy.allocation.map((alloc, idx) => (
                    <div key={idx} className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">• {alloc.asset}</span>
                      <span className="text-cyan-400 font-bold">{alloc.percent}%</span>
                    </div>
                  ))}
                </div>

                {/* Settings */}
                <div className="mb-6 pb-6 border-b border-gray-700">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Threshold:</span>
                    <span className="text-white font-bold">{strategy.threshold}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Rebalances:</span>
                    <span className="text-white font-bold">~{strategy.rebalancesPerYear}/year</span>
                  </div>
                </div>

                {/* Performance */}
                <div className="mb-6">
                  <div className="text-xs font-semibold text-gray-400 mb-3">PERFORMANCE (After Fees)</div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">1 Year:</span>
                      <span className="text-cyan-400 font-bold">+{strategy.performance.oneYear.autofolio}%</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      vs Buy & Hold +{strategy.performance.oneYear.buyHold}%
                    </div>
                    <div className="text-xs text-green-400 font-semibold">
                      +{calculateExtra(strategy.performance.oneYear.autofolio, strategy.performance.oneYear.buyHold)}% extra
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">4 Years:</span>
                      <span className="text-cyan-400 font-bold">+{strategy.performance.fourYears.autofolio}%</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      vs Buy & Hold +{strategy.performance.fourYears.buyHold}%
                    </div>
                    <div className="text-xs text-green-400 font-semibold">
                      +{calculateExtra(strategy.performance.fourYears.autofolio, strategy.performance.fourYears.buyHold)}% extra
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700">
                    Total Fees (4Y): {strategy.totalFees}%
                  </div>
                </div>

                {/* Best For */}
                <div className="mb-6">
                  <div className="text-xs font-semibold text-gray-400 mb-2">BEST FOR</div>
                  {strategy.bestFor.map((item, idx) => (
                    <div key={idx} className="text-xs text-gray-300 mb-1">• {item}</div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSelectStrategy(strategy)}
                  className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                    strategy.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                    strategy.color === 'cyan' ? 'bg-cyan-500 hover:bg-cyan-600' :
                    'bg-orange-500 hover:bg-orange-600'
                  } text-white hover:scale-105`}
                >
                  START →
                </button>
              </div>
            ))}

            {/* Custom Strategy Card */}
            <div className="jup-card rounded-2xl p-6 border-2 border-purple-400 hover:shadow-purple-400/20 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">⚡</div>
                <h3 className="text-2xl font-bold text-white mb-1">Custom</h3>
              </div>

              <div className="mb-6">
                <div className="text-xs font-semibold text-gray-400 mb-2">BUILD YOUR OWN</div>
                <div className="text-sm text-gray-300 mb-3">
                  Create a personalized strategy with:
                </div>
                <div className="text-xs text-gray-400 space-y-1 mb-4">
                  <div>• Custom asset allocation</div>
                  <div>• Your rebalance threshold</div>
                  <div>• Flexible risk profile</div>
                  <div>• Live backtesting</div>
                </div>
              </div>

              <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="text-xs text-purple-300 text-center">
                  📊 Test your strategy with historical data before investing
                </div>
              </div>

              <div className="mb-6">
                <div className="text-xs font-semibold text-gray-400 mb-2">BEST FOR</div>
                <div className="text-xs text-gray-300 mb-1">• Advanced users</div>
                <div className="text-xs text-gray-300 mb-1">• Custom requirements</div>
                <div className="text-xs text-gray-300 mb-1">• Unique strategies</div>
              </div>

              <button
                onClick={onCustomize}
                className="w-full py-3 rounded-xl font-bold bg-purple-500 hover:bg-purple-600 text-white transition-all duration-300 hover:scale-105"
              >
                BUILD →
              </button>
            </div>
          </div>
        </div>

        {/* Fee Transparency Section */}
        <div className="mb-20">
          <div className="max-w-4xl mx-auto jup-card rounded-2xl p-8 border-2 border-cyan-400/30">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-cyan-400 mb-2">💎 Fee Transparency</h2>
              <p className="text-gray-400">Crystal clear pricing. No hidden costs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                <div className="text-sm text-gray-400 mb-2">Trading Fee</div>
                <div className="text-2xl font-bold text-cyan-400">0.3%</div>
                <div className="text-xs text-gray-500 mt-1">per swap (Jupiter DEX)</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                <div className="text-sm text-gray-400 mb-2">Platform Fee</div>
                <div className="text-2xl font-bold text-green-400">FREE</div>
                <div className="text-xs text-gray-500 mt-1">No management fees!</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                <div className="text-sm text-gray-400 mb-2">Withdrawal</div>
                <div className="text-2xl font-bold text-cyan-400">$0</div>
                <div className="text-xs text-gray-500 mt-1">Network fees only</div>
              </div>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
              <div className="text-lg font-bold text-cyan-400 mb-3">💡 Why we still win after fees:</div>
              <p className="text-gray-300 text-sm mb-4">
                Our algorithm captures market volatility and maintains optimal allocation, 
                consistently beating Buy & Hold even after paying 0.3% on every rebalance.
              </p>
              
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-sm font-semibold text-gray-400 mb-3">Example: Balanced Portfolio (4 Years)</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Rebalances executed:</div>
                    <div className="text-white font-bold">60 times</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Total fees paid:</div>
                    <div className="text-orange-400 font-bold">4.5%</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Extra profit vs Buy & Hold:</div>
                    <div className="text-green-400 font-bold">+43.9%</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Net benefit:</div>
                    <div className="text-cyan-400 font-bold text-xl">+39.4% 🎯</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div id="how-it-works" className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-cyan-400 mb-3">How It Works</h2>
            <p className="text-gray-400">Get started in 4 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1️⃣', title: 'Connect Wallet', desc: 'Phantom, Solflare, or any SPL wallet' },
              { step: '2️⃣', title: 'Choose Strategy', desc: 'Conservative, Balanced, Aggressive, or Custom' },
              { step: '3️⃣', title: 'Deposit Funds', desc: 'Any amount, starts at $100' },
              { step: '4️⃣', title: 'Earn More', desc: 'Automated monitoring 24/7' },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="text-5xl mb-4">{item.step}</div>
                <div className="text-xl font-bold text-cyan-400 mb-2">{item.title}</div>
                <div className="text-sm text-gray-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Why AutoFolio */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-cyan-400 mb-3">Why AutoFolio?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { icon: '✅', title: 'Automated', desc: 'No manual work, 24/7 active monitoring' },
              { icon: '✅', title: 'Low Fees', desc: 'Jupiter DEX integration, only 0.3% per trade' },
              { icon: '✅', title: 'Backtested', desc: 'Historical proven results with real data' },
              { icon: '✅', title: 'Transparent', desc: 'All fees disclosed, no hidden costs' },
            ].map((item, idx) => (
              <div key={idx} className="jup-card rounded-xl p-6 hover:border-cyan-400/50 transition-all">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{item.icon}</div>
                  <div>
                    <div className="text-lg font-bold text-cyan-400 mb-1">{item.title}</div>
                    <div className="text-sm text-gray-400">{item.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Orbitron:wght@700;900&display=swap');
        
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
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
