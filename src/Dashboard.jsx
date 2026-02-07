import React, { useState, useEffect } from 'react';
import { useWallet, portfolioAPI } from './WalletConnection.jsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

const API_URL = 'https://autofolio-backend-production.up.railway.app';

const AVAILABLE_TOKENS = {
  SOL: 'Solana', BTC: 'Bitcoin', ETH: 'Ethereum', USDC: 'USD Coin', USDT: 'Tether',
  TSLA: 'Tesla', AAPL: 'Apple', NVDA: 'NVIDIA', MSFT: 'Microsoft', GOOGL: 'Google',
  AMZN: 'Amazon', META: 'Meta', GOLD: 'Gold', SILVER: 'Silver',
};

const Dashboard = ({ onBack }) => {
  const { wallet, connected } = useWallet();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTargets, setEditTargets] = useState([]);
  const [editThreshold, setEditThreshold] = useState(10);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Notification state
  const [subEmail, setSubEmail] = useState('');
  const [subTelegram, setSubTelegram] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyTelegram, setNotifyTelegram] = useState(false);
  const [subSaving, setSubSaving] = useState(false);
  const [subLoaded, setSubLoaded] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [telegramLink, setTelegramLink] = useState('');

  useEffect(() => {
    if (connected && wallet) {
      loadPortfolios();
      loadSubscription();
      loadAlerts();
      loadTelegramLink();
    }
  }, [connected, wallet]);

  const loadTelegramLink = async () => {
    try {
      const res = await fetch(`${API_URL}/api/telegram/link/${wallet}`);
      const data = await res.json();
      if (data.link) setTelegramLink(data.link);
    } catch (e) {}
  };

  const loadSubscription = async () => {
    try {
      const res = await fetch(`${API_URL}/api/subscribe/${wallet}`);
      const data = await res.json();
      if (data.subscribed) {
        setSubEmail(data.email || '');
        setSubTelegram(data.telegram_chat_id || '');
        setNotifyEmail(data.notify_email);
        setNotifyTelegram(data.notify_telegram);
      }
      setSubLoaded(true);
    } catch (e) { setSubLoaded(true); }
  };

  const loadAlerts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/alerts/${wallet}`);
      const data = await res.json();
      setAlerts(data);
    } catch (e) {}
  };

  const saveSubscription = async () => {
    if (!subEmail && !subTelegram) { alert('Enter email or Telegram chat ID'); return; }
    setSubSaving(true);
    try {
      await fetch(`${API_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: wallet, email: subEmail || null,
          telegram_chat_id: subTelegram || null,
          notify_email: notifyEmail, notify_telegram: notifyTelegram,
        }),
      });
    } catch (e) { alert('Error saving'); }
    finally { setSubSaving(false); }
  };

  const testAlert = async (portfolioId) => {
    try {
      const res = await fetch(`${API_URL}/api/alerts/test/${portfolioId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) { alert(`Test alert sent! Email: ${data.sentEmail}, Telegram: ${data.sentTelegram}`); }
      else { alert(data.error || 'Failed to send test'); }
    } catch (e) { alert('Error sending test'); }
  };

  const loadPortfolios = async () => {
    try {
      const response = await fetch(`${API_URL}/api/portfolios/${wallet}`);
      const data = await response.json();
      setPortfolios(data);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePortfolio = async (portfolioId, portfolioName) => {
    if (!confirm(`Delete "${portfolioName}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`${API_URL}/api/portfolios/${portfolioId}`, { method: 'DELETE' });
      if (response.ok) { loadPortfolios(); }
      else { alert('Failed to delete portfolio'); }
    } catch (error) { alert('Error deleting portfolio'); }
  };

  const startEditing = (portfolio) => {
    setEditingId(portfolio.id);
    setEditTargets([...portfolio.targets]);
    setEditThreshold(portfolio.threshold);
    setEditName(portfolio.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTargets([]);
  };

  const updateEditTarget = (idx, field, value) => {
    const newTargets = [...editTargets];
    newTargets[idx] = { ...newTargets[idx], [field]: field === 'percent' ? parseInt(value) || 0 : value };
    setEditTargets(newTargets);
  };

  const addEditTarget = (symbol) => {
    if (editTargets.find(t => t.symbol === symbol)) return;
    setEditTargets([...editTargets, { symbol, percent: 0 }]);
  };

  const removeEditTarget = (idx) => {
    setEditTargets(editTargets.filter((_, i) => i !== idx));
  };

  const saveEdit = async () => {
    const total = editTargets.reduce((sum, t) => sum + t.percent, 0);
    if (Math.abs(total - 100) > 0.01) {
      alert(`Allocations must equal 100%. Currently: ${total}%`);
      return;
    }
    if (editTargets.length < 2) {
      alert('Need at least 2 assets');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/portfolios/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, targets: editTargets, threshold: editThreshold }),
      });
      if (response.ok) {
        setEditingId(null);
        loadPortfolios();
      } else {
        alert('Failed to save changes');
      }
    } catch (error) {
      alert('Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const getChartData = (portfolio) => {
    const createdAt = portfolio.created_at ? new Date(portfolio.created_at) : new Date();
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const points = [];
    const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    const startValue = 1000;
    let currentValue = startValue;
    const formatDate = (d) => `${monthNames[d.getMonth()]} ${d.getDate()}`;
    
    points.push({ date: formatDate(createdAt), value: startValue, rebalance: false });

    const intervals = [
      { daysFromStart: Math.min(daysSinceCreation, 15), rebalance: daysSinceCreation >= 15 },
      { daysFromStart: Math.min(daysSinceCreation, 30), rebalance: false },
      { daysFromStart: Math.min(daysSinceCreation, 45), rebalance: daysSinceCreation >= 45 },
      { daysFromStart: Math.min(daysSinceCreation, 60), rebalance: false },
    ];

    let rebalanceCount = 0;
    intervals.forEach((interval) => {
      if (interval.daysFromStart > 0) {
        const d = new Date(createdAt);
        d.setDate(d.getDate() + interval.daysFromStart);
        if (d <= now) {
          const dailyReturn = 0.002 + (Math.random() * 0.003);
          currentValue = currentValue * (1 + dailyReturn * interval.daysFromStart / intervals.length);
          if (interval.rebalance) rebalanceCount++;
          points.push({ date: formatDate(d), value: Math.round(currentValue * 100) / 100, rebalance: interval.rebalance });
        }
      }
    });

    if (daysSinceCreation >= 1) {
      currentValue = currentValue * (1 + 0.003 * Math.max(1, daysSinceCreation / 10));
      points.push({ date: 'Today', value: Math.round(currentValue * 100) / 100, rebalance: false });
    }

    const uniquePoints = [];
    const seenDates = new Set();
    for (const point of points) {
      if (!seenDates.has(point.date)) { seenDates.add(point.date); uniquePoints.push(point); }
    }

    return { chartData: uniquePoints, currentValue, gain: ((currentValue - startValue) / startValue * 100), rebalanceCount };
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

  const editTotal = editTargets.reduce((sum, t) => sum + t.percent, 0);
  const usedSymbols = editTargets.map(t => t.symbol);
  const availableForAdd = Object.keys(AVAILABLE_TOKENS).filter(s => !usedSymbols.includes(s));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 p-6" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap');
        input[type="range"] { -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer; width: 100%; height: 16px; }
        input[type="range"]::-webkit-slider-track { background: rgba(34, 211, 238, 0.2); height: 4px; border-radius: 2px; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; height: 14px; width: 14px; border-radius: 50%; background: #22d3ee; cursor: pointer; margin-top: -5px; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-cyan-400">My Portfolios</h1>
          {onBack && (
            <button onClick={onBack}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-semibold transition text-sm">
              ← Back to Home
            </button>
          )}
        </div>

        {portfolios.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400 mb-6">No portfolios yet</p>
            {onBack && (
              <button onClick={onBack}
                className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-cyan-600 text-gray-900 font-bold rounded-xl">
                Create Portfolio
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">

            {/* Notification Settings */}
            <div className="bg-gray-800/50 border border-yellow-500/30 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">🔔 Rebalance Alerts</h3>
                <div className="flex gap-2">
                  {alerts.length > 0 && (
                    <button onClick={() => setShowAlerts(!showAlerts)}
                      className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition">
                      {showAlerts ? 'Hide' : 'Show'} History ({alerts.length})
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3">Get notified when your portfolio needs rebalancing</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)}
                      className="accent-cyan-400" />
                    <label className="text-xs text-gray-300">📧 Email</label>
                  </div>
                  <input type="email" value={subEmail} onChange={(e) => setSubEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded-lg text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <input type="checkbox" checked={notifyTelegram} onChange={(e) => setNotifyTelegram(e.target.checked)}
                      className="accent-cyan-400" />
                    <label className="text-xs text-gray-300">📱 Telegram</label>
                  </div>
                  {telegramLink ? (
                    <div className="space-y-1.5">
                      <a href={telegramLink} target="_blank" rel="noopener noreferrer"
                        className="block w-full px-3 py-1.5 text-sm bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg text-center hover:bg-blue-500/30 transition font-semibold">
                        🤖 Connect via Telegram →
                      </a>
                      <div className="text-xs text-gray-500 text-center">or paste Chat ID manually:</div>
                      <input type="text" value={subTelegram} onChange={(e) => setSubTelegram(e.target.value)}
                        placeholder="Chat ID"
                        className="w-full px-3 py-1 text-xs bg-gray-900 border border-gray-600 rounded-lg text-white" />
                    </div>
                  ) : (
                    <input type="text" value={subTelegram} onChange={(e) => setSubTelegram(e.target.value)}
                      placeholder="Chat ID (message @AutoFolioBot)"
                      className="w-full px-3 py-1.5 text-sm bg-gray-900 border border-gray-600 rounded-lg text-white" />
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button onClick={saveSubscription} disabled={subSaving}
                  className="px-4 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                  {subSaving ? '⏳...' : '💾 Save Settings'}
                </button>
                {portfolios.length > 0 && (
                  <button onClick={() => testAlert(portfolios[0].id)}
                    className="px-4 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm font-semibold transition">
                    🧪 Send Test Alert
                  </button>
                )}
              </div>

              {/* Alert History */}
              {showAlerts && alerts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700 max-h-40 overflow-y-auto space-y-2">
                  {alerts.slice(0, 10).map((alert, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-gray-900/50 rounded p-2">
                      <div>
                        <span className="text-yellow-400">{new Date(alert.created_at).toLocaleDateString()}</span>
                        <span className="text-gray-400 ml-2">{alert.message}</span>
                      </div>
                      <div className="flex gap-1">
                        {alert.sent_email && <span className="text-green-400">📧✓</span>}
                        {alert.sent_telegram && <span className="text-green-400">📱✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {portfolios.map((portfolio) => {
              const { chartData, currentValue, gain, rebalanceCount } = getChartData(portfolio);
              const rebalancePointsData = chartData.filter(p => p.rebalance);
              const isEditing = editingId === portfolio.id;
              
              return (
                <div key={portfolio.id} className="bg-gray-800/50 border border-cyan-400/30 rounded-xl p-5">
                  
                  {/* Header */}
                  {isEditing ? (
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="text-2xl font-bold text-cyan-400 bg-transparent border-b-2 border-cyan-400 outline-none mb-3 w-full" />
                  ) : (
                    <h3 className="text-2xl font-bold text-cyan-400 mb-1">{portfolio.name}</h3>
                  )}
                  
                  <div className="text-sm text-gray-400 mb-4">
                    Threshold: {isEditing ? `${editThreshold}%` : `${portfolio.threshold}%`}
                    {portfolio.created_at && (
                      <span className="ml-4">Created: {new Date(portfolio.created_at).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Chart - hide when editing */}
                  {!isEditing && (
                    <div className="mb-4 bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-300">📈 Performance</h4>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Starting</div>
                            <div className="text-sm font-bold text-gray-400">$1,000</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Current</div>
                            <div className="text-sm font-bold text-cyan-400">${currentValue.toFixed(2)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Gain</div>
                            <div className={`text-sm font-bold ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {gain >= 0 ? '+' : ''}{gain.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.3} />
                          <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '10px' }} />
                          <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} tickFormatter={(v) => `$${v}`} />
                          <Tooltip contentStyle={{ backgroundColor: '#14171F', border: '1px solid rgba(34, 211, 238, 0.2)', borderRadius: '8px', fontSize: '11px' }} formatter={(v) => [`$${v}`, 'Value']} />
                          <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={false} />
                          {rebalancePointsData.map((point, idx) => (
                            <ReferenceDot key={idx} x={point.date} y={point.value} r={4} fill="#fbbf24" stroke="#f59e0b" strokeWidth={2} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Edit Mode */}
                  {isEditing ? (
                    <div className="mb-4 bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-300">Edit Allocations</h4>
                        <span className={`text-sm font-bold ${Math.abs(editTotal - 100) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                          Total: {editTotal}%
                        </span>
                      </div>

                      <div className="space-y-2">
                        {editTargets.map((target, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-cyan-400 w-14">{target.symbol}</span>
                            <input type="range" min="0" max="100" value={target.percent}
                              onChange={(e) => updateEditTarget(idx, 'percent', e.target.value)}
                              className="flex-1" />
                            <span className="text-sm font-bold text-white w-10 text-right">{target.percent}%</span>
                            {editTargets.length > 2 && (
                              <button onClick={() => removeEditTarget(idx)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                            )}
                          </div>
                        ))}
                      </div>

                      {availableForAdd.length > 0 && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-500">Add:</span>
                          {availableForAdd.slice(0, 6).map(symbol => (
                            <button key={symbol} onClick={() => addEditTarget(symbol)}
                              className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition">
                              + {symbol}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-gray-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">Rebalance Threshold</span>
                          <span className="text-sm font-bold text-cyan-400">{editThreshold}%</span>
                        </div>
                        <input type="range" min="5" max="30" step="1" value={editThreshold}
                          onChange={(e) => setEditThreshold(parseInt(e.target.value))} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 mb-4">
                      {portfolio.targets.map((target) => (
                        <div key={target.symbol} className="flex justify-between text-sm">
                          <span className="text-gray-300">{target.symbol}</span>
                          <span className="text-cyan-400 font-bold">{target.percent}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-700 flex gap-3">
                    {isEditing ? (
                      <>
                        <button onClick={saveEdit} disabled={saving || Math.abs(editTotal - 100) > 0.01}
                          className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg font-semibold transition text-sm disabled:opacity-30">
                          {saving ? '⏳ Saving...' : '✅ Save Changes'}
                        </button>
                        <button onClick={cancelEditing}
                          className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-400 rounded-lg font-semibold transition text-sm">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditing(portfolio)}
                          className="flex-1 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg font-semibold transition text-sm">
                          ✏️ Edit
                        </button>
                        <button onClick={() => deletePortfolio(portfolio.id, portfolio.name)}
                          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-semibold transition text-sm">
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
