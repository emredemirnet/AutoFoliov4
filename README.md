# AutoFolio Backend

Automated portfolio rebalancing service for Solana/Jupiter.

## Features

✅ Portfolio monitoring (every 5 minutes)
✅ Real-time price feeds (Pyth Network + Jupiter)
✅ Email notifications when rebalance needed
✅ Jupiter swap integration
✅ PostgreSQL database
✅ RESTful API

## Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values
nano .env

# Run locally
npm run dev
```

## Deploy to Production

See [DEPLOY.md](DEPLOY.md) for Railway/Render deployment.

## API Endpoints

### Health Check
```
GET /health
Response: {"status":"ok","timestamp":"..."}
```

### Create User
```
POST /api/users
Body: {
  "wallet_address": "YourSolanaWallet...",
  "email": "you@example.com"
}
```

### Create Portfolio
```
POST /api/portfolios
Body: {
  "wallet_address": "YourSolanaWallet...",
  "name": "My Portfolio",
  "threshold": 10,
  "targets": [
    {"symbol": "SOL", "percent": 30},
    {"symbol": "USDC", "percent": 70}
  ]
}
```

### Get Portfolios
```
GET /api/portfolios/:wallet_address
```

### Get Prices
```
GET /api/prices
Response: {"SOL": 100, "BTC": 42000, ...}
```

### Get Wallet Balances
```
GET /api/balances/:wallet_address
Response: {
  "SOL": {"balance": 10, "price": 100, "value": 1000},
  "USDC": {"balance": 5000, "price": 1, "value": 5000}
}
```

### Get Swap Quote
```
POST /api/swap/quote
Body: {
  "inputToken": "SOL",
  "outputToken": "USDC",
  "amount": "1000000000"
}
```

## Database Schema

### users
- id (serial)
- wallet_address (unique)
- email
- created_at

### portfolios
- id (serial)
- user_id (FK)
- name
- active (boolean)
- threshold (decimal)
- last_rebalance
- created_at

### portfolio_targets
- id (serial)
- portfolio_id (FK)
- token_symbol
- token_mint
- target_percent

### rebalance_history
- id (serial)
- portfolio_id (FK)
- executed_at
- swaps_executed (jsonb)
- total_value_usd
- success

## Monitoring Service

Runs every 5 minutes:
1. Fetch all active portfolios
2. Get wallet balances from Solana
3. Get current prices from Pyth/Jupiter
4. Calculate current vs target allocations
5. If drift > threshold, send email alert

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `EMAIL_USER` - Gmail address
- `EMAIL_PASS` - Gmail app password

Optional:
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (production/development)

## Tech Stack

- Node.js + Express
- PostgreSQL
- Solana Web3.js
- Pyth Network (prices)
- Jupiter API (swaps)
- Nodemailer (emails)

## License

MIT
