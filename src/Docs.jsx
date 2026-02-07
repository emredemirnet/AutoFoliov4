import React, { useState } from 'react';

const Docs = ({ onBack }) => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'rebalancing', label: 'Rebalancing Engine' },
    { id: 'assets', label: 'Supported Assets' },
    { id: 'notifications', label: 'Alert System' },
    { id: 'fees', label: 'Fees' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'mobile', label: 'Mobile dApp' },
    { id: 'roadmap', label: 'Roadmap' },
    { id: 'onchain', label: 'On-Chain Vision' },
  ];

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Orbitron:wght@700;900&display=swap');
        .glow-text { text-shadow: 0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2); }
        .doc-card { background: rgba(20, 23, 31, 0.6); border: 1px solid rgba(34, 211, 238, 0.1); backdrop-filter: blur(20px); }
        .doc-section { scroll-margin-top: 80px; }
      `}</style>

      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white rounded-lg transition text-sm">
                ← Home
              </button>
            )}
            <h1 className="text-xl font-bold text-cyan-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>AutoFolio</h1>
            <span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5 rounded">DOCS</span>
          </div>
          <div className="hidden md:flex items-center gap-1 overflow-x-auto">
            {sections.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className={`px-2 py-1 rounded text-xs transition whitespace-nowrap ${activeSection === s.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ========== OVERVIEW ========== */}
        <section id="overview" className="doc-section mb-16">
          <h2 className="text-4xl font-black text-cyan-400 mb-6 glow-text" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            AutoFolio
          </h2>
          <div className="text-lg text-gray-300 leading-relaxed mb-6">
            AutoFolio is an automated portfolio rebalancing engine built on Solana. 
            It monitors multi-asset portfolios in real-time, detects when allocations drift 
            beyond user-defined thresholds, and triggers rebalancing actions — either through 
            notifications or automated on-chain execution.
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="doc-card rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm font-bold text-white">Backtest</div>
              <div className="text-xs text-gray-400 mt-1">12 months of real market data</div>
            </div>
            <div className="doc-card rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🔔</div>
              <div className="text-sm font-bold text-white">Alert</div>
              <div className="text-xs text-gray-400 mt-1">Email & Telegram notifications</div>
            </div>
            <div className="doc-card rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-sm font-bold text-white">Execute</div>
              <div className="text-xs text-gray-400 mt-1">On-chain auto-rebalance (coming)</div>
            </div>
          </div>

          <div className="doc-card rounded-xl p-5">
            <h3 className="text-sm font-bold text-cyan-400 mb-3">The Problem</h3>
            <p className="text-sm text-gray-300 mb-4">
              Holding a diversified portfolio means your allocations drift over time. Bitcoin rallies 40% 
              while Gold drops 5% — suddenly your "balanced" portfolio is heavily concentrated in one asset. 
              Manual rebalancing is tedious, emotional, and most people never do it.
            </p>
            <h3 className="text-sm font-bold text-cyan-400 mb-3">The Solution</h3>
            <p className="text-sm text-gray-300">
              AutoFolio continuously monitors your target allocations and automatically rebalances when 
              drift exceeds your threshold. Our backtests show this strategy consistently outperforms 
              buy-and-hold across different market conditions — capturing gains from volatility instead 
              of suffering from it.
            </p>
          </div>
        </section>

        {/* ========== HOW IT WORKS ========== */}
        <section id="how-it-works" className="doc-section mb-16">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">How It Works</h2>
          
          <div className="space-y-4">
            {[
              { num: '1', title: 'Define Your Portfolio', desc: 'Choose assets (crypto, stocks, commodities) and set target allocation percentages. Example: 40% SOL, 30% BTC, 20% ETH, 10% USDC.' },
              { num: '2', title: 'Set Rebalance Threshold', desc: 'Define how much drift you allow before rebalancing triggers. 10% threshold on a 40% SOL allocation means rebalance triggers when SOL hits 44% or 36%.' },
              { num: '3', title: 'Continuous Monitoring', desc: 'Our engine checks live prices every 15 minutes against your target allocations using CoinGecko (crypto) and TwelveData (stocks/commodities).' },
              { num: '4', title: 'Alert & Execute', desc: 'When threshold is breached, you receive a detailed notification showing exactly what to buy/sell. Phase 3 will execute these trades automatically on-chain via Jupiter.' },
            ].map((step) => (
              <div key={step.num} className="doc-card rounded-xl p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 font-bold flex-shrink-0">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Flow Diagram */}
          <div className="mt-6 doc-card rounded-xl p-5">
            <h3 className="text-sm font-bold text-gray-300 mb-4">System Flow</h3>
            <div className="flex items-center justify-between text-center text-xs gap-2">
              {[
                { icon: '💰', label: 'Live Prices', sub: 'CoinGecko + TwelveData' },
                { icon: '→', label: '', sub: '' },
                { icon: '📊', label: 'Monitor Engine', sub: 'Every 15 min' },
                { icon: '→', label: '', sub: '' },
                { icon: '⚖️', label: 'Drift Check', sub: 'vs Threshold' },
                { icon: '→', label: '', sub: '' },
                { icon: '🔔', label: 'Alert / Execute', sub: 'Email + Telegram' },
              ].map((item, idx) => (
                <div key={idx} className={item.icon === '→' ? 'text-cyan-400 text-lg' : 'flex-1'}>
                  {item.icon === '→' ? '→' : (
                    <div className="doc-card rounded-lg p-2">
                      <div className="text-xl mb-1">{item.icon}</div>
                      <div className="text-white font-semibold">{item.label}</div>
                      <div className="text-gray-500 text-xs">{item.sub}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== REBALANCING ENGINE ========== */}
        <section id="rebalancing" className="doc-section mb-16">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">Rebalancing Engine</h2>

          <div className="doc-card rounded-xl p-5 mb-4">
            <h3 className="text-sm font-bold text-white mb-3">Threshold-Based Rebalancing</h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              AutoFolio uses a relative threshold model. Each asset's drift is measured as a percentage 
              of its target allocation, not as an absolute percentage point.
            </p>
            
            <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
              <div className="text-xs text-cyan-400 font-bold mb-2">Example:</div>
              <div className="text-xs text-gray-300 space-y-1">
                <div>Target: SOL 40% | Threshold: 10%</div>
                <div>Trigger point: 40% × 10% = 4% deviation</div>
                <div>Rebalance fires when SOL reaches 44% or 36%</div>
              </div>
            </div>

            <div className="text-xs text-gray-400 leading-relaxed">
              This relative approach means assets with larger allocations get proportionally wider bands, 
              while smaller allocations (e.g., 10% USDC) trigger more sensitively — which is correct 
              behavior since small allocations drift proportionally faster.
            </div>
          </div>

          <div className="doc-card rounded-xl p-5 mb-4">
            <h3 className="text-sm font-bold text-white mb-3">Trading Fee Model</h3>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Every rebalance incurs a ~0.1% trading fee (Jupiter DEX platform fee + typical slippage). 
              This fee is applied only to the swap amount, not the total portfolio value.
            </p>
            <div className="bg-gray-900/50 rounded-lg p-3 text-xs text-gray-300">
              <div>Portfolio: $10,000 | Drift: SOL overweight by $500</div>
              <div>Swap: Sell $500 SOL → Buy $500 BTC</div>
              <div>Fee: $500 × 0.1% = <span className="text-yellow-400">$0.50</span></div>
            </div>
          </div>

          <div className="doc-card rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Why Rebalancing Beats Buy & Hold</h3>
            <div className="text-xs text-gray-400 space-y-2 leading-relaxed">
              <p>
                <span className="text-cyan-400 font-semibold">Mean Reversion:</span> Markets tend to oscillate. 
                Rebalancing systematically sells high (overweight) and buys low (underweight), capturing profits 
                from volatility.
              </p>
              <p>
                <span className="text-cyan-400 font-semibold">Risk Management:</span> Prevents portfolio 
                concentration. A 100% BTC rally doesn't leave you with 80% BTC exposure.
              </p>
              <p>
                <span className="text-cyan-400 font-semibold">Discipline:</span> Removes emotion from trading 
                decisions. The algorithm rebalances mechanically, avoiding panic sells and FOMO buys.
              </p>
            </div>
          </div>
        </section>

        {/* ========== SUPPORTED ASSETS ========== */}
        <section id="assets" className="doc-section mb-16">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">Supported Assets</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="doc-card rounded-xl p-4">
              <h3 className="text-sm font-bold text-cyan-400 mb-3">💰 Crypto</h3>
              <div className="text-xs text-gray-300 space-y-1.5">
                {[
                  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A' },
                  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA' },
                  { symbol: 'SOL', name: 'Solana', color: '#14F195' },
                  { symbol: 'USDC', name: 'USD Coin', color: '#2775CA' },
                  { symbol: 'USDT', name: 'Tether', color: '#26A17B' },
                ].map(a => (
                  <div key={a.symbol} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }}></span>
                    <span className="font-semibold">{a.symbol}</span>
                    <span className="text-gray-500">{a.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-500">Source: CoinGecko API</div>
            </div>

            <div className="doc-card rounded-xl p-4">
              <h3 className="text-sm font-bold text-blue-400 mb-3">📈 Stocks</h3>
              <div className="text-xs text-gray-300 space-y-1.5">
                {[
                  { symbol: 'AAPL', name: 'Apple' },
                  { symbol: 'TSLA', name: 'Tesla' },
                  { symbol: 'NVDA', name: 'NVIDIA' },
                  { symbol: 'MSFT', name: 'Microsoft' },
                  { symbol: 'GOOGL', name: 'Google' },
                  { symbol: 'AMZN', name: 'Amazon' },
                  { symbol: 'META', name: 'Meta' },
                ].map(a => (
                  <div key={a.symbol} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <span className="font-semibold">{a.symbol}</span>
                    <span className="text-gray-500">{a.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-500">Source: TwelveData API</div>
            </div>

            <div className="doc-card rounded-xl p-4">
              <h3 className="text-sm font-bold text-yellow-400 mb-3">🥇 Commodities</h3>
              <div className="text-xs text-gray-300 space-y-1.5">
                {[
                  { symbol: 'GOLD', name: 'Gold (XAU/USD)' },
                  { symbol: 'SILVER', name: 'Silver (XAG/USD)' },
                ].map(a => (
                  <div key={a.symbol} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                    <span className="font-semibold">{a.symbol}</span>
                    <span className="text-gray-500">{a.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-500">Source: TwelveData API</div>
            </div>
          </div>

          <div className="mt-4 doc-card rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-300 mb-2">Data Refresh Rates</h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div><span className="text-cyan-400">Live Prices:</span> <span className="text-gray-400">Every 2 minutes</span></div>
              <div><span className="text-cyan-400">Historical Data:</span> <span className="text-gray-400">Every 6 hours</span></div>
              <div><span className="text-cyan-400">Portfolio Monitor:</span> <span className="text-gray-400">Every 15 minutes</span></div>
            </div>
          </div>
        </section>

        {/* ========== NOTIFICATION SYSTEM ========== */}
        <section id="notifications" className="doc-section mb-16">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">Alert System</h2>
          
          <div className="doc-card rounded-xl p-5 mb-4">
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              AutoFolio monitors your portfolio 24/7 and sends you actionable alerts when your 
              allocations drift beyond your threshold. Each alert includes exactly what to buy and sell, 
              at what price, to bring your portfolio back to target.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-lg mb-2">📧</div>
                <h4 className="text-sm font-bold text-white mb-1">Email Alerts</h4>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>• Detailed HTML report with action table</div>
                  <div>• Current vs target allocation breakdown</div>
                  <div>• Live price for each asset</div>
                  <div>• Direct link to execute on Jupiter</div>
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-lg mb-2">📱</div>
                <h4 className="text-sm font-bold text-white mb-1">Telegram Alerts</h4>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>• Instant push notification</div>
                  <div>• Formatted BUY/SELL actions</div>
                  <div>• One-tap link to Jupiter swap</div>
                  <div>• Chat with @AutoFolioBot to connect</div>
                </div>
              </div>
            </div>
          </div>

          <div className="doc-card rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Alert Rules</h3>
            <div className="text-xs text-gray-400 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span><span className="text-white font-semibold">Cooldown:</span> Maximum one alert per portfolio every 6 hours to prevent spam</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span><span className="text-white font-semibold">Minimum Drift:</span> Alert only fires when deviation exceeds both the threshold AND 2% absolute to filter noise</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span><span className="text-white font-semibold">Multi-Channel:</span> Receive on email, Telegram, or both simultaneously</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span><span className="text-white font-semibold">Test Alerts:</span> Send yourself a test notification anytime from the dashboard</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========== FEES ========== */}
        <section id="fees" className="doc-section mb-16">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">Fees</h2>
          
          <div className="doc-card rounded-xl p-5">
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Platform Fee', value: 'FREE', color: 'text-green-400', sub: 'No management fee' },
                { label: 'Trading Fee', value: '0.1%', color: 'text-cyan-400', sub: 'Per swap (Jupiter)' },
                { label: 'Monitoring', value: 'FREE', color: 'text-green-400', sub: '24/7 alerts included' },
                { label: 'Withdrawal', value: '$0', color: 'text-cyan-400', sub: 'SOL network fee only' },
              ].map((fee, idx) => (
                <div key={idx} className="text-center bg-gray-900/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">{fee.label}</div>
                  <div className={`text-xl font-bold ${fee.color}`}>{fee.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{fee.sub}</div>
                </div>
              ))}
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <h4 className="text-sm font-bold text-cyan-400 mb-2">Net Benefit Analysis</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Our backtests show that even after paying ~0.1% per trade, rebalancing outperforms 
                buy-and-hold in sideways and volatile market conditions. The key insight: rebalancing 
                captures value from volatility (sell high / buy low), which more than compensates for 
                trading fees. In strong bull markets, buy & hold may temporarily lead — but rebalancing 
                provides crucial downside protection and consistent risk management.
              </p>
            </div>
          </div>
        </section>

        {/* ========== ARCHITECTURE ========== */}
        <section id="architecture" className="doc-section mb-16">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">Architecture</h2>
          
          <div className="doc-card rounded-xl p-5 mb-4">
            <h3 className="text-sm font-bold text-white mb-4">Tech Stack</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-cyan-400 mb-2">Frontend</h4>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>• React + Vite</div>
                  <div>• Recharts (data visualization)</div>
                  <div>• Tailwind CSS</div>
                  <div>• Solana Wallet Adapter</div>
                  <div>• Mobile: React Native + Expo</div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-cyan-400 mb-2">Backend</h4>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>• Node.js + Express</div>
                  <div>• PostgreSQL (Railway)</div>
                  <div>• CoinGecko API (crypto prices)</div>
                  <div>• TwelveData API (stocks/commodities)</div>
                  <div>• Resend (email) + Telegram Bot API</div>
                </div>
              </div>
            </div>
          </div>

          <div className="doc-card rounded-xl p-5 mb-4">
            <h3 className="text-sm font-bold text-white mb-4">Data Flow</h3>
            <div className="bg-gray-900/50 rounded-lg p-4 text-xs text-gray-300 font-mono space-y-2">
              <div className="text-cyan-400">// Price Pipeline</div>
              <div>CoinGecko → BTC, ETH, SOL prices (every 2 min)</div>
              <div>TwelveData → AAPL, TSLA, GOLD prices (every 2 min)</div>
              <div>Cache → In-memory with 2min TTL</div>
              <div className="mt-3 text-cyan-400">// Historical Pipeline</div>
              <div>CoinGecko → 365 day crypto history (every 6h)</div>
              <div>TwelveData → 365 day stock/commodity history (every 6h)</div>
              <div>Cache → In-memory with 6h TTL</div>
              <div className="mt-3 text-cyan-400">// Monitor Pipeline</div>
              <div>Live Prices × Portfolio Targets → Drift Calculation</div>
              <div>Drift {'>'} Threshold → Generate Alert</div>
              <div>Alert → Email (Resend) + Telegram (Bot API)</div>
              <div>Alert → PostgreSQL (history log)</div>
            </div>
          </div>

          <div className="doc-card rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Database Schema</h3>
            <div className="bg-gray-900/50 rounded-lg p-4 text-xs text-gray-300 font-mono space-y-3">
              <div>
                <span className="text-cyan-400">portfolios</span>
                <span className="text-gray-500"> (id, wallet_address, name, threshold, created_at, active)</span>
              </div>
              <div>
                <span className="text-cyan-400">portfolio_targets</span>
                <span className="text-gray-500"> (id, portfolio_id, token_symbol, target_percent)</span>
              </div>
              <div>
                <span className="text-cyan-400">subscribers</span>
                <span className="text-gray-500"> (id, wallet_address, email, telegram_chat_id, notify_email, notify_telegram)</span>
              </div>
              <div>
                <span className="text-cyan-400">alerts</span>
                <span className="text-gray-500"> (id, portfolio_id, wallet_address, alert_type, message, actions, sent_email, sent_telegram)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========== MOBILE ========== */}
        <section id="mobile" className="doc-section mb-16">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">Mobile dApp</h2>
          
          <div className="doc-card rounded-xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
              <span className="text-xs font-bold text-yellow-400">IN DEVELOPMENT</span>
            </div>
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              AutoFolio is being built as a native Solana Mobile dApp, designed specifically for the 
              Solana dApp Store and Seeker device. This is not a PWA port — it's built from the ground 
              up for mobile using React Native and the Solana Mobile Stack.
            </p>
            
            <h3 className="text-sm font-bold text-white mb-3">Solana Mobile Stack Integration</h3>
            <div className="text-xs text-gray-400 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span><span className="text-white font-semibold">Mobile Wallet Adapter:</span> Native wallet connection via Phantom, Solflare, and other Solana wallets on mobile</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span><span className="text-white font-semibold">Solana Mobile SDK:</span> Direct integration with @solana-mobile/mobile-wallet-adapter-protocol for transaction signing</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span><span className="text-white font-semibold">dApp Store Ready:</span> Functional APK built for Solana dApp Store distribution on Seeker</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span><span className="text-white font-semibold">Native Push Notifications:</span> Firebase Cloud Messaging for real-time rebalance alerts on mobile</span>
              </div>
            </div>
          </div>

          <div className="doc-card rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Mobile Features</h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-white font-semibold mb-1">Portfolio Dashboard</div>
                <div>Real-time portfolio view with live prices and allocation charts</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-white font-semibold mb-1">Instant Alerts</div>
                <div>Push notifications when rebalancing needed with one-tap Jupiter swap</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-white font-semibold mb-1">Backtest on Mobile</div>
                <div>Run strategy simulations with real historical data directly on phone</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-white font-semibold mb-1">Wallet Integration</div>
                <div>Sign transactions natively through Mobile Wallet Adapter protocol</div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== ROADMAP ========== */}
        <section id="roadmap" className="doc-section mb-16">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">Roadmap</h2>
          
          <div className="space-y-4">
            <div className="doc-card rounded-xl p-5 border border-green-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                <span className="text-xs font-bold text-green-400">PHASE 1 — LIVE</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Backtest & Alert Engine</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div>✅ Multi-asset portfolio builder</div>
                <div>✅ 12-month historical backtesting</div>
                <div>✅ Real market data (CoinGecko + TwelveData)</div>
                <div>✅ Email & Telegram notifications</div>
                <div>✅ Strategy presets (Conservative, Balanced, Aggressive)</div>
                <div>✅ Portfolio CRUD with inline editing</div>
                <div>✅ Crypto + Stocks + Commodities support</div>
                <div>✅ Alert history & cooldown system</div>
              </div>
            </div>

            <div className="doc-card rounded-xl p-5 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                <span className="text-xs font-bold text-yellow-400">PHASE 2 — IN PROGRESS</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">Mobile dApp & Smart Notifications</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div>🔄 Solana Mobile Stack native app</div>
                <div>🔄 dApp Store submission (Seeker)</div>
                <div>🔄 Mobile Wallet Adapter integration</div>
                <div>🔄 Push notifications (Firebase)</div>
                <div>🔄 Jupiter swap deep links in alerts</div>
                <div>🔄 Advanced alert customization</div>
                <div>🔄 Real portfolio performance tracking</div>
                <div>🔄 Social sharing of backtest results</div>
              </div>
            </div>

            <div className="doc-card rounded-xl p-5 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span className="text-xs font-bold text-cyan-400">PHASE 3 — PLANNED</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">On-Chain Automated Rebalancing</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div>🎯 Anchor smart contract (Vault + PDA)</div>
                <div>🎯 Deposit SOL/SPL tokens to vault</div>
                <div>🎯 Jupiter V6 on-chain swap integration</div>
                <div>🎯 Automated rebalance execution</div>
                <div>🎯 Withdraw anytime (non-custodial PDA)</div>
                <div>🎯 On-chain performance tracking</div>
                <div>🎯 Multi-sig governance option</div>
                <div>🎯 Security audit (Soteria/OtterSec)</div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== ON-CHAIN VISION ========== */}
        <section id="onchain" className="doc-section mb-16">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">On-Chain Vision (Phase 3)</h2>
          
          <div className="doc-card rounded-xl p-5 mb-4">
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              The ultimate goal of AutoFolio is fully decentralized, on-chain portfolio rebalancing. 
              Users deposit funds into a Solana program-controlled vault. The rebalancing engine executes 
              swaps via Jupiter's on-chain program, maintaining target allocations automatically — 
              no human intervention required.
            </p>

            <h3 className="text-sm font-bold text-white mb-3">Smart Contract Architecture</h3>
            <div className="bg-gray-900/50 rounded-lg p-4 text-xs text-gray-300 font-mono space-y-2">
              <div className="text-cyan-400">// Anchor Program: autofolio_vault</div>
              <div></div>
              <div><span className="text-yellow-400">initialize_vault</span>(owner, targets[], threshold)</div>
              <div className="text-gray-500 ml-4">→ Creates PDA vault for user</div>
              <div className="text-gray-500 ml-4">→ Stores target allocations on-chain</div>
              <div></div>
              <div><span className="text-yellow-400">deposit</span>(vault_pda, amount, token_mint)</div>
              <div className="text-gray-500 ml-4">→ Transfer SPL tokens to vault PDA</div>
              <div className="text-gray-500 ml-4">→ Update vault balance state</div>
              <div></div>
              <div><span className="text-yellow-400">rebalance</span>(vault_pda, jupiter_swap_ix)</div>
              <div className="text-gray-500 ml-4">→ Check allocation drift vs threshold</div>
              <div className="text-gray-500 ml-4">→ Execute Jupiter swap via CPI</div>
              <div className="text-gray-500 ml-4">→ Only callable by authorized keeper</div>
              <div></div>
              <div><span className="text-yellow-400">withdraw</span>(vault_pda, amount, token_mint)</div>
              <div className="text-gray-500 ml-4">→ Only vault owner can withdraw</div>
              <div className="text-gray-500 ml-4">→ Transfer tokens back to user wallet</div>
            </div>
          </div>

          <div className="doc-card rounded-xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Security Model</h3>
            <div className="text-xs text-gray-400 space-y-2 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span><span className="text-white font-semibold">Non-Custodial PDAs:</span> Each user's vault is a Program Derived Address — only the Solana program can move funds, and only according to the user's defined rules</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span><span className="text-white font-semibold">Owner-Only Withdraw:</span> Only the vault creator can withdraw funds. No admin keys, no backdoors</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span><span className="text-white font-semibold">Keeper Authorization:</span> Rebalance can only be triggered by an authorized keeper address, preventing unauthorized trades</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span><span className="text-white font-semibold">Audit Required:</span> Smart contract will undergo professional security audit before mainnet deployment</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800 text-center">
          <div className="text-cyan-400 font-bold text-lg mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>AutoFolio</div>
          <p className="text-xs text-gray-500">Set It. Forget It. Stay Balanced.</p>
          <p className="text-xs text-gray-600 mt-2">Built on Solana • Powered by Jupiter</p>
        </div>
      </div>
    </div>
  );
};

export default Docs;
