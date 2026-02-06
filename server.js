// server.js - AutoFolio Backend Service
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { PythHttpClient } = require('@pythnetwork/client');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Solana connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta')
);

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Token mint addresses (Solana mainnet)
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BTC: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
};

// ============================================
// DATABASE FUNCTIONS
// ============================================

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      wallet_address VARCHAR(44) UNIQUE NOT NULL,
      email VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS portfolios (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name VARCHAR(100) DEFAULT 'My Portfolio',
      active BOOLEAN DEFAULT true,
      threshold DECIMAL(5,2) DEFAULT 10.0,
      last_rebalance TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS portfolio_targets (
      id SERIAL PRIMARY KEY,
      portfolio_id INTEGER REFERENCES portfolios(id),
      token_symbol VARCHAR(10) NOT NULL,
      token_mint VARCHAR(44) NOT NULL,
      target_percent DECIMAL(5,2) NOT NULL,
      UNIQUE(portfolio_id, token_symbol)
    );

    CREATE TABLE IF NOT EXISTS rebalance_history (
      id SERIAL PRIMARY KEY,
      portfolio_id INTEGER REFERENCES portfolios(id),
      executed_at TIMESTAMP DEFAULT NOW(),
      swaps_executed JSONB,
      total_value_usd DECIMAL(15,2),
      success BOOLEAN DEFAULT true
    );

    CREATE INDEX IF NOT EXISTS idx_portfolios_active ON portfolios(active);
    CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
  `);
  console.log('✅ Database initialized');
}

// ============================================
// PRICE FUNCTIONS (Jupiter Price API v6)
// ============================================

async function getPrices() {
  try {
    // Jupiter Price API v6 - Correct format
    const mints = [
      'So11111111111111111111111111111111111111112', // SOL
      '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // BTC (Wrapped)
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    ].join(',');

    const response = await fetch(`https://api.jup.ag/price/v2?ids=${mints}`);
    const data = await response.json();

    console.log('Jupiter API response:', data);

    const prices = {
      SOL: data.data?.['So11111111111111111111111111111111111111112']?.price || 0,
      BTC: data.data?.['3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh']?.price || 0,
      USDC: data.data?.['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']?.price || 1,
      USDT: data.data?.['Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB']?.price || 1,
    };

    console.log('✅ Fetched prices:', prices);
    return prices;
  } catch (error) {
    console.error('Error fetching prices:', error);
    // Fallback prices
    return { SOL: 150, BTC: 95000, USDC: 1, USDT: 1 };
  }
}

// ============================================
// PORTFOLIO MONITORING
// ============================================

async function getWalletBalances(walletAddress) {
  try {
    const pubkey = new PublicKey(walletAddress);
    
    // Get SOL balance
    const solBalance = await connection.getBalance(pubkey);
    
    // Get token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });

    const balances = {
      SOL: solBalance / 1e9
    };

    // Parse token balances
    tokenAccounts.value.forEach(account => {
      const data = account.account.data.parsed.info;
      const mint = data.mint;
      const amount = data.tokenAmount.uiAmount;

      for (const [symbol, tokenMint] of Object.entries(TOKENS)) {
        if (mint === tokenMint) {
          balances[symbol] = amount;
          break;
        }
      }
    });

    return balances;
  } catch (error) {
    console.error('Error getting wallet balances:', error);
    return {};
  }
}

async function checkPortfolioBalance(portfolio) {
  try {
    const userResult = await pool.query('SELECT wallet_address, email FROM users WHERE id = $1', [portfolio.user_id]);
    if (userResult.rows.length === 0) return;
    
    const { wallet_address, email } = userResult.rows[0];

    const targetsResult = await pool.query(
      'SELECT token_symbol, target_percent FROM portfolio_targets WHERE portfolio_id = $1',
      [portfolio.id]
    );
    const targets = targetsResult.rows;

    const balances = await getWalletBalances(wallet_address);
    const prices = await getPrices();

    let totalValue = 0;
    const currentAllocations = {};

    for (const [symbol, balance] of Object.entries(balances)) {
      const price = prices[symbol] || 0;
      const value = balance * price;
      totalValue += value;
      currentAllocations[symbol] = { balance, value, price };
    }

    let needsRebalance = false;
    const drifts = {};

    targets.forEach(target => {
      const symbol = target.token_symbol;
      const targetPercent = parseFloat(target.target_percent);
      const currentValue = currentAllocations[symbol]?.value || 0;
      const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
      const drift = Math.abs(currentPercent - targetPercent);

      drifts[symbol] = {
        target: targetPercent,
        current: currentPercent,
        drift: drift
      };

      if (drift > parseFloat(portfolio.threshold)) {
        needsRebalance = true;
      }
    });

    if (needsRebalance) {
      console.log(`⚠️  Portfolio ${portfolio.id} needs rebalancing`);
      
      if (email) {
        await sendRebalanceNotification(email, portfolio, drifts, totalValue);
      }

      return { needsRebalance: true, drifts, totalValue };
    }

    return { needsRebalance: false, drifts, totalValue };
  } catch (error) {
    console.error('Error checking portfolio balance:', error);
    return { needsRebalance: false };
  }
}

// ============================================
// JUPITER SWAP INTEGRATION
// ============================================

async function getJupiterQuote(inputMint, outputMint, amount) {
  try {
    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`;
    const response = await fetch(url);
    const quote = await response.json();
    return quote;
  } catch (error) {
    console.error('Error getting Jupiter quote:', error);
    return null;
  }
}

async function executeJupiterSwap(userWallet, quote) {
  try {
    const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: userWallet,
        wrapAndUnwrapSol: true,
      })
    });

    const { swapTransaction } = await swapResponse.json();
    return swapTransaction;
  } catch (error) {
    console.error('Error executing Jupiter swap:', error);
    return null;
  }
}

// ============================================
// EMAIL NOTIFICATIONS
// ============================================

async function sendRebalanceNotification(email, portfolio, drifts, totalValue) {
  const driftDetails = Object.entries(drifts)
    .map(([symbol, data]) => `${symbol}: ${data.current.toFixed(2)}% (target: ${data.target}%, drift: ${data.drift.toFixed(2)}%)`)
    .join('\n');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🔔 AutoFolio: Rebalance Needed',
    text: `Your portfolio "${portfolio.name}" has drifted beyond your ${portfolio.threshold}% threshold.

Current Allocations:
${driftDetails}

Total Portfolio Value: $${totalValue.toFixed(2)}

Login to AutoFolio to execute rebalance: https://autofolio.space

Best regards,
AutoFolio Team`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// ============================================
// API ENDPOINTS
// ============================================

app.post('/api/users', async (req, res) => {
  try {
    const { wallet_address, email } = req.body;
    
    const result = await pool.query(
      'INSERT INTO users (wallet_address, email) VALUES ($1, $2) ON CONFLICT (wallet_address) DO UPDATE SET email = $2 RETURNING *',
      [wallet_address, email]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/portfolios', async (req, res) => {
  try {
    const { wallet_address, name, threshold, targets } = req.body;

    let userResult = await pool.query('SELECT id FROM users WHERE wallet_address = $1', [wallet_address]);
    let userId;

    if (userResult.rows.length === 0) {
      const newUser = await pool.query('INSERT INTO users (wallet_address) VALUES ($1) RETURNING id', [wallet_address]);
      userId = newUser.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    const portfolioResult = await pool.query(
      'INSERT INTO portfolios (user_id, name, threshold) VALUES ($1, $2, $3) RETURNING *',
      [userId, name || 'My Portfolio', threshold || 10]
    );
    const portfolio = portfolioResult.rows[0];

    for (const target of targets) {
      await pool.query(
        'INSERT INTO portfolio_targets (portfolio_id, token_symbol, token_mint, target_percent) VALUES ($1, $2, $3, $4)',
        [portfolio.id, target.symbol, TOKENS[target.symbol], target.percent]
      );
    }

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/portfolios/:wallet_address', async (req, res) => {
  try {
    const { wallet_address } = req.params;

    const result = await pool.query(`
      SELECT p.*, array_agg(json_build_object('symbol', pt.token_symbol, 'percent', pt.target_percent)) as targets
      FROM portfolios p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN portfolio_targets pt ON p.id = pt.portfolio_id
      WHERE u.wallet_address = $1 AND p.active = true
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [wallet_address]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/prices', async (req, res) => {
  try {
    const prices = await getPrices();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/balances/:wallet_address', async (req, res) => {
  try {
    const { wallet_address } = req.params;
    const balances = await getWalletBalances(wallet_address);
    const prices = await getPrices();

    const result = {};
    for (const [symbol, balance] of Object.entries(balances)) {
      result[symbol] = {
        balance,
        price: prices[symbol] || 0,
        value: balance * (prices[symbol] || 0)
      };
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/swap/quote', async (req, res) => {
  try {
    const { inputToken, outputToken, amount } = req.body;
    const inputMint = TOKENS[inputToken];
    const outputMint = TOKENS[outputToken];

    if (!inputMint || !outputMint) {
      return res.status(400).json({ error: 'Invalid tokens' });
    }

    const quote = await getJupiterQuote(inputMint, outputMint, amount);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rebalance', async (req, res) => {
  try {
    const { portfolio_id, wallet_address } = req.body;

    const check = await checkPortfolioBalance({ id: portfolio_id, user_id: 1, threshold: 10 });

    if (!check.needsRebalance) {
      return res.json({ message: 'Portfolio balanced, no rebalance needed' });
    }

    res.json({ needsRebalance: true, drifts: check.drifts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// MONITORING SERVICE (runs every 5 minutes)
// ============================================

async function monitorAllPortfolios() {
  try {
    console.log('🔍 Monitoring all active portfolios...');

    const result = await pool.query('SELECT * FROM portfolios WHERE active = true');
    const portfolios = result.rows;

    for (const portfolio of portfolios) {
      await checkPortfolioBalance(portfolio);
    }

    console.log(`✅ Checked ${portfolios.length} portfolios`);
  } catch (error) {
    console.error('Error monitoring portfolios:', error);
  }
}

setInterval(monitorAllPortfolios, 5 * 60 * 1000);

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 AutoFolio backend running on port ${PORT}`);
      console.log(`📊 Monitoring service active`);
      
      setTimeout(monitorAllPortfolios, 5000);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
// Version: 1.0.1
