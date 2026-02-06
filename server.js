const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { Connection, PublicKey } = require('@solana/web3.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Solana connection
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(SOLANA_RPC, 'confirmed');

// =============================================
// JUPITER PRICE API - Live prices
// =============================================

// Solana token mint addresses for Jupiter
const JUPITER_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  BTC: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // Wrapped BTC (Portal)
  ETH: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // Wrapped ETH (Portal)
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
};

let priceCache = {};
let lastPriceUpdate = 0;
const PRICE_CACHE_DURATION = 60 * 1000; // 1 minute (Jupiter is fast)

async function updatePricesFromJupiter() {
  const now = Date.now();
  if (now - lastPriceUpdate < PRICE_CACHE_DURATION && Object.keys(priceCache).length > 0) {
    return priceCache;
  }

  try {
    const mintIds = Object.values(JUPITER_MINTS).join(',');
    const url = `https://api.jup.ag/price/v2?ids=${mintIds}`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      const newCache = {};

      for (const [symbol, mint] of Object.entries(JUPITER_MINTS)) {
        const priceData = data.data?.[mint];
        if (priceData && priceData.price) {
          newCache[symbol] = parseFloat(priceData.price);
        }
      }

      if (Object.keys(newCache).length > 0) {
        priceCache = newCache;
        console.log('✅ Jupiter live prices:', JSON.stringify(priceCache, null, 0));
      } else {
        console.log('⚠️ Jupiter returned empty data, keeping cache');
      }
    } else {
      console.log(`⚠️ Jupiter API returned ${response.status}`);
    }

    lastPriceUpdate = now;
    return priceCache;
  } catch (error) {
    console.error('❌ Jupiter price error:', error.message);
    lastPriceUpdate = now;
    return priceCache;
  }
}

// =============================================
// COINGECKO - Historical prices only (backtest)
// =============================================

const COINGECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  USDC: 'usd-coin',
  USDT: 'tether',
  JUP: 'jupiter-exchange-solana',
  BONK: 'bonk',
  WIF: 'dogwifcoin',
  PYTH: 'pyth-network',
  RAY: 'raydium',
  ORCA: 'orca',
};

let historicalCache = {};
let lastHistoricalUpdate = 0;
const HISTORICAL_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

async function fetchHistoricalPrices() {
  const now = Date.now();
  if (now - lastHistoricalUpdate < HISTORICAL_CACHE_DURATION && Object.keys(historicalCache).length > 0) {
    console.log('Using cached historical prices');
    return historicalCache;
  }

  console.log('📊 Fetching historical prices from CoinGecko...');
  const result = {};

  for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
    if (symbol === 'USDC' || symbol === 'USDT') {
      result[symbol] = Array(366).fill(1);
      continue;
    }

    try {
      const url = `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart?vs_currency=usd&days=365&interval=daily`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        result[symbol] = data.prices.map(p => p[1]);
        console.log(`  ✅ ${symbol}: ${result[symbol].length} data points`);
      } else {
        console.log(`  ⚠️ ${symbol}: CoinGecko returned ${response.status}`);
        result[symbol] = null;
      }

      // Rate limit: 2.5s between requests (free tier: 30 calls/min)
      await new Promise(resolve => setTimeout(resolve, 2500));
    } catch (error) {
      console.error(`  ❌ ${symbol}: ${error.message}`);
      result[symbol] = null;
    }
  }

  historicalCache = result;
  lastHistoricalUpdate = now;
  console.log('📊 Historical prices loaded');
  return result;
}

// =============================================
// DATABASE
// =============================================

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolios (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(44) NOT NULL,
        name VARCHAR(100) NOT NULL,
        threshold INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        active BOOLEAN DEFAULT true
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolio_targets (
        id SERIAL PRIMARY KEY,
        portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
        token_symbol VARCHAR(10) NOT NULL,
        target_percent DECIMAL(5,2) NOT NULL
      )
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// =============================================
// ROUTES
// =============================================

app.get('/', (req, res) => {
  res.json({
    status: 'AutoFolio Backend Running',
    priceSource: 'Jupiter Price API V2',
    historicalSource: 'CoinGecko',
    timestamp: new Date().toISOString()
  });
});

// Live prices from Jupiter
app.get('/api/prices', async (req, res) => {
  try {
    const prices = await updatePricesFromJupiter();
    res.json(prices);
  } catch (error) {
    res.json(priceCache);
  }
});

// Historical prices from CoinGecko (for backtest)
app.get('/api/historical-prices', async (req, res) => {
  try {
    const data = await fetchHistoricalPrices();
    res.json(data);
  } catch (error) {
    console.error('❌ Historical prices error:', error.message);
    res.status(500).json({ error: 'Failed to fetch historical prices' });
  }
});

// Available tokens list
app.get('/api/tokens', (req, res) => {
  const tokens = Object.entries(JUPITER_MINTS).map(([symbol, mint]) => ({
    symbol,
    mint,
    hasHistorical: !!COINGECKO_IDS[symbol]
  }));
  res.json(tokens);
});

app.get('/api/balances/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const pubkey = new PublicKey(walletAddress);
    const solBalance = await connection.getBalance(pubkey);

    res.json({
      SOL: { balance: solBalance / 1e9 }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

app.post('/api/portfolios', async (req, res) => {
  const client = await pool.connect();

  try {
    const { wallet_address, name, threshold, targets } = req.body;

    if (!wallet_address || !name || !threshold || !targets) {
      client.release();
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const totalPercent = targets.reduce((sum, t) => sum + t.percent, 0);
    if (Math.abs(totalPercent - 100) > 0.01) {
      client.release();
      return res.status(400).json({ error: 'Total must equal 100%' });
    }

    await client.query('BEGIN');

    const portfolioResult = await client.query(
      'INSERT INTO portfolios (wallet_address, name, threshold) VALUES ($1, $2, $3) RETURNING *',
      [wallet_address, name, threshold]
    );

    const portfolio = portfolioResult.rows[0];

    for (const target of targets) {
      await client.query(
        'INSERT INTO portfolio_targets (portfolio_id, token_symbol, target_percent) VALUES ($1, $2, $3)',
        [portfolio.id, target.symbol, target.percent]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(portfolio);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Portfolio creation error:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get('/api/portfolios/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const result = await pool.query(
      `SELECT p.*, 
        json_agg(json_build_object('symbol', pt.token_symbol, 'percent', pt.target_percent)) as targets
       FROM portfolios p
       LEFT JOIN portfolio_targets pt ON p.id = pt.portfolio_id
       WHERE p.wallet_address = $1 AND p.active = true
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [walletAddress]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Fetch portfolios error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/portfolios', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, 
        json_agg(json_build_object('symbol', pt.token_symbol, 'percent', pt.target_percent)) as targets
       FROM portfolios p
       LEFT JOIN portfolio_targets pt ON p.id = pt.portfolio_id
       WHERE p.active = true
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Fetch all portfolios error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/portfolios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE portfolios SET active = false WHERE id = $1',
      [id]
    );

    console.log(`✅ Portfolio ${id} deleted`);
    res.json({ success: true, message: 'Portfolio deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// START SERVER
// =============================================

app.listen(PORT, async () => {
  console.log(`🚀 AutoFolio Backend running on port ${PORT}`);
  await initDatabase();

  // Fetch live prices from Jupiter
  await updatePricesFromJupiter();
  setInterval(updatePricesFromJupiter, PRICE_CACHE_DURATION);

  // Fetch historical prices from CoinGecko in background
  fetchHistoricalPrices().catch(err => console.error('Historical fetch error:', err));
  setInterval(() => fetchHistoricalPrices().catch(err => console.error('Historical fetch error:', err)), HISTORICAL_CACHE_DURATION);

  console.log('⏰ Jupiter (live) + CoinGecko (historical) scheduled');
});
