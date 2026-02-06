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

// Price cache - update every 10 minutes
let priceCache = {
  SOL: 150,
  BTC: 95000,
  ETH: 3500,
  USDC: 1,
  USDT: 1
};
let lastPriceUpdate = 0;
const PRICE_CACHE_DURATION = 10 * 60 * 1000;

async function updatePrices() {
  const now = Date.now();
  if (now - lastPriceUpdate < PRICE_CACHE_DURATION) {
    console.log('Using cached prices');
    return priceCache;
  }

  try {
    console.log('✅ Using fallback prices');
    lastPriceUpdate = now;
    return priceCache;
  } catch (error) {
    console.error('Error updating prices:', error);
    return priceCache;
  }
}

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

app.get('/', (req, res) => {
  res.json({ 
    status: 'AutoFolio Backend Running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/prices', async (req, res) => {
  try {
    const prices = await updatePrices();
    res.json(prices);
  } catch (error) {
    res.json(priceCache);
  }
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

app.listen(PORT, async () => {
  console.log(`🚀 AutoFolio Backend running on port ${PORT}`);
  await initDatabase();
  await updatePrices();
  setInterval(updatePrices, PRICE_CACHE_DURATION);
  console.log('⏰ Price updates scheduled');
});
