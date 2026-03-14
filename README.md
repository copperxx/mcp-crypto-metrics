# Crypto Metrics MCP Server

Hybrid MCP server combining **Coingecko**, **Defillama**, and crypto analysis for Claude.

## Features

✅ **Market Data** - Dominance, market cap, volume, price trends  
✅ **DeFi Metrics** - TVL, protocols, staking data  
✅ **Cycle Analysis** - BTC/ETH cycle indicators (Mayer Multiple, dominance)  
✅ **Free APIs** - No authentication, no paid tiers  
✅ **Claude Integration** - Custom Connector ready  

## Data Sources

- **Coingecko API v3** - Market cap, volume, price data
- **Defillama API** - DeFi TVL, protocol metrics
- **Derived metrics** - Cycle signals, Mayer Multiple proxy

## Quick Start

### Local Testing

```bash
cd mcp-crypto-metrics
npm install
npm start
```

Server runs on `http://localhost:3000`

Test endpoint:
```bash
curl http://localhost:3000/health
```

### Cloud Deployment

See **DEPLOYMENT.md** for Render.com free tier setup (5 minutes).

Once deployed, use in Claude via Custom Connector:
```
https://mcp-crypto-metrics.onrender.com/mcp
```

## Available Tools

### Market Overview
- `get_btc_eth_dominance` - Current BTC/ETH dominance + total market cap
- `get_market_cap_data(limit)` - Top coins by market cap
- `get_market_summary` - Quick market snapshot

### DeFi
- `get_defi_tvl(limit)` - Top protocols by TVL
- `get_protocol_metrics(protocol_name)` - Aave, Curve, Uniswap, etc.
- `get_staking_metrics` - ETH staking overview

### Trading
- `get_volume_metrics(limit)` - Top by 24h volume
- `analyze_cycle_metrics(lookback_days)` - BTC/ETH cycle signals

## Example Queries in Claude

```
"BTC dominance son 24 saatte ne kadar değişti?"
→ Pulls BTC dominance + analysis

"DeFi'de hangi protokol en fazla TVL'e sahip?"
→ Lists top 15 protocols

"BTC şu anda cycle top mu bottom mu?"
→ Analyzes Mayer Multiple, dominance, volume
```

## Technical Stack

- **Node.js** (no external dependencies)
- **Fetch API** for HTTP calls
- **MCP Protocol** for Claude integration
- **Free tier** APIs (no keys needed)

## Limitations & Considerations

- Mayer Multiple is a **proxy** (uses current price / 150k as 365-day SMA estimate)
- Free APIs have rate limits but sufficient for personal use
- Historical data limited to last 365 days from Coingecko
- Token Terminal metrics not included (free tier lacks API; HTML scraping would be brittle)

## Next Steps

1. Deploy on Render.com (see DEPLOYMENT.md)
2. Connect via Claude Custom Connector
3. Ask Claude for analysis, trends, comparisons
4. Refine metrics based on your trading workflow

---

**For Pine Script integration**: Export data as JSON and use in external tools or build a separate integration.
