const getWalletProviders = () => {
  const providers = [];
  
  if (window.phantom?.solana?.isPhantom) {
    providers.push({ name: 'Phantom', provider: window.phantom.solana, icon: '👻' });
  }
  if (window.solflare?.isSolflare) {
    providers.push({ name: 'Solflare', provider: window.solflare, icon: '🔥' });
  }
  if (window.backpack) {
    providers.push({ name: 'Backpack', provider: window.backpack, icon: '🎒' });
  }
  if (window.coinbaseSolana) {
    providers.push({ name: 'Coinbase', provider: window.coinbaseSolana, icon: '🔵' });
  }
  if (window.jupiter?.solana) {
    providers.push({ name: 'Jupiter', provider: window.jupiter.solana, icon: '🪐' });
  }
  
  // Debug - console'da tüm window objesini kontrol edelim
  console.log('Available wallet providers:', {
    phantom: !!window.phantom?.solana,
    solflare: !!window.solflare,
    backpack: !!window.backpack,
    coinbase: !!window.coinbaseSolana,
    jupiter: !!window.jupiter,
    allKeys: Object.keys(window).filter(k => k.toLowerCase().includes('wallet') || k.toLowerCase().includes('solana'))
  });
  
  return providers;
};
