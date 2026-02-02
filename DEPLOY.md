# AutoFolio Backend - Railway Deployment Guide

## Quick Deploy (5 minutes)

### 1. Create Railway Account
- Go to https://railway.app
- Sign up with GitHub
- Free tier: $5 credit (enough for testing)

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Connect your GitHub account
- Select autofolio-backend repo

### 3. Add PostgreSQL Database
- In Railway dashboard, click "+ New"
- Select "Database" → "PostgreSQL"
- Railway will auto-create and connect it
- DATABASE_URL will be set automatically

### 4. Set Environment Variables
Click on your service → Variables → Add these:

```
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
PORT=3001
NODE_ENV=production
```

**Get Solana RPC (Optional but recommended):**
- Free: https://www.quicknode.com (10M requests/mo)
- Or: https://www.helius.dev (also free tier)

**Get Gmail App Password:**
1. Enable 2FA on Gmail
2. Go to https://myaccount.google.com/apppasswords
3. Create new app password
4. Copy the 16-character code

### 5. Deploy
- Railway auto-deploys on git push
- Watch logs in Railway dashboard
- Should see: "🚀 AutoFolio backend running on port 3001"

### 6. Get Your API URL
- Railway gives you a URL like: `autofolio-backend-production.up.railway.app`
- Test it: `curl https://your-url.railway.app/health`
- Should return: `{"status":"ok","timestamp":"..."}`

## Alternative: Render.com Deployment

### 1. Create Render Account
- Go to https://render.com
- Free tier available

### 2. Create Web Service
- New → Web Service
- Connect GitHub repo
- Build Command: `npm install`
- Start Command: `npm start`

### 3. Add PostgreSQL
- New → PostgreSQL
- Copy DATABASE_URL
- Add to environment variables

### 4. Set Environment Variables
Same as Railway above

### 5. Deploy
- Render auto-deploys
- Free tier: Spins down after inactivity (slower first load)

## Testing Your Backend

```bash
# Health check
curl https://your-backend-url.com/health

# Get prices
curl https://your-backend-url.com/api/prices

# Get balances (replace with real Solana wallet)
curl https://your-backend-url.com/api/balances/YourWalletAddressHere
```

## Connecting Frontend

In your frontend `.env`:
```
VITE_API_URL=https://your-backend-url.railway.app
```

## Monitoring

**Railway Dashboard:**
- Metrics → CPU, Memory, Network
- Logs → Real-time logs
- Deployments → History

**Set up alerts:**
- Railway → Settings → Notifications
- Get email on deployment failures

## Costs

**Railway (Recommended):**
- Free: $5 credit
- After: $0.000463/GB-hour RAM (~$3-5/mo)
- PostgreSQL: $5/mo

**Render:**
- Free tier: 750 hours/mo
- Paid: $7/mo

**Total: ~$5-10/mo for MVP**

## Scaling

When you hit 1,000+ users:
- Upgrade to Railway Pro ($20/mo)
- Or use dedicated Postgres ($15/mo)
- Add Redis for caching
- Total: ~$30-50/mo

## Troubleshooting

**"Cannot connect to database":**
- Check DATABASE_URL is set
- Railway auto-sets this, don't override

**"Email not sending":**
- Check EMAIL_USER and EMAIL_PASS
- Make sure Gmail App Password is correct
- Gmail may block less secure apps - use App Password

**"Solana RPC errors":**
- Free RPC has rate limits
- Upgrade to QuickNode paid ($50/mo for production)

**"Out of memory":**
- Railway free tier: 512MB
- Upgrade to 1GB: +$5/mo

## Next Steps

Once deployed:
1. Test all API endpoints
2. Connect your frontend
3. Test wallet connection
4. Create test portfolio
5. Monitor for 24 hours
6. Launch to users! 🚀

## Support

Issues? Check:
- Railway logs
- Server logs (`console.log` statements)
- Network tab in browser devtools

Need help? DM me or check Railway docs: https://docs.railway.app
