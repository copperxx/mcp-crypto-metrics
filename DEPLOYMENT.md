# Crypto Metrics MCP Server - Deployment Guide

## Tools Available

### Market Data
- **get_btc_eth_dominance** - BTC/ETH market dominance + total cap
- **get_market_cap_data** - Top coins by market cap (customizable limit)
- **get_volume_metrics** - Trading volume leaders
- **get_market_summary** - Comprehensive market overview

### DeFi Metrics
- **get_defi_tvl** - Top protocols by TVL (Defillama)
- **get_staking_metrics** - ETH staking and major staking data
- **get_protocol_metrics** - Specific protocol data (TVL, APY, etc.)

### Analysis
- **analyze_cycle_metrics** - BTC/ETH cycle indicators (Mayer Multiple proxy, dominance, volume)

---

## Deployment on Render.com (Free Tier)

### Step 1: Push to GitHub

1. Initialize git repo:
```bash
cd /home/claude/mcp-crypto-metrics
git init
git add .
git commit -m "Initial MCP crypto metrics server"
```

2. Create a **GitHub repository** (if you don't have one, create at github.com)

3. Push code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/mcp-crypto-metrics.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render.com

1. Go to https://render.com and **Sign up** (free)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub and select the repository
4. Configure:
   - **Name**: `mcp-crypto-metrics`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Click **"Create Web Service"**

Render will deploy and give you a URL like:
```
https://mcp-crypto-metrics.onrender.com
```

### Step 3: Test the Server

```bash
curl https://mcp-crypto-metrics.onrender.com/health
```

Should return: `{"status":"ok"}`

---

## Connect to Claude

### In Claude.ai:

1. **Settings** → **Connectors**
2. Click **"Add custom connector"**
3. Enter URL:
```
https://mcp-crypto-metrics.onrender.com/mcp
```
4. Click **"Add"**
5. No authentication needed (public APIs)

---

## Usage in Claude

Once connected, you can ask Claude:

```
"BTC ve ETH dominance'ı şu anda ne durumda?"
→ Uses get_btc_eth_dominance

"Top 20 coin'i listelesene"
→ Uses get_market_cap_data(limit: 20)

"DeFi protokollerinde TVL ne kadar?"
→ Uses get_defi_tvl

"BTC cycle analiz et"
→ Uses analyze_cycle_metrics
```

---

## Troubleshooting

- **Render goes to sleep on free tier**: Free tier Web Services spin down after 15 minutes of inactivity. Just make a request and it'll wake up.
- **API rate limits**: Coingecko and Defillama free tiers have generous limits. No issues for personal use.
- **CORS issues**: Server allows all origins, should work fine with Claude.

---

## Future Enhancements

- Add Token Terminal HTML scraping (if needed for specific metrics not in Coingecko/Defillama)
- Store historical data for trend analysis
- Add more indicators (RSI, MACD proxies via API data)
- Export data to CSV/JSON for Excel/Pine Script
