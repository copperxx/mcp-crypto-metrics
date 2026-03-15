#!/usr/bin/env node
import http from "http";

const tools = [
  { name: "get_defi_protocols", description: "Top DeFi protocols by TVL (Defillama)", input_schema: { type: "object", properties: {} } },
  { name: "get_blockchain_tvl", description: "TVL by blockchain (Defillama)", input_schema: { type: "object", properties: {} } },
  { name: "get_protocol_fees", description: "Protocol fees and revenue 24h (Defillama)", input_schema: { type: "object", properties: {} } },
  { name: "get_global_market", description: "Global market cap, dominance, volume (Coingecko)", input_schema: { type: "object", properties: {} } },
  { name: "get_trending_coins", description: "Trending coins (Coingecko)", input_schema: { type: "object", properties: {} } },
  { name: "get_defi_metrics", description: "DeFi market metrics (Coingecko)", input_schema: { type: "object", properties: {} } },
  { name: "get_coin_prices", description: "Prices for Bitcoin, Ethereum, major coins (Coingecko)", input_schema: { type: "object", properties: {} } },
  { name: "get_market_top_100", description: "Top 100 coins by market cap (Coingecko)", input_schema: { type: "object", properties: {} } },
  { name: "get_exchange_24h", description: "24h exchange data - BTC, ETH, top pairs (Binance)", input_schema: { type: "object", properties: {} } },
  { name: "get_klines", description: "BTCUSDT klines - 30 days (Binance)", input_schema: { type: "object", properties: {} } },
  { name: "get_top_100_cmc", description: "Top 100 coins (CoinMarketCap)", input_schema: { type: "object", properties: {} } },
  { name: "get_fear_greed", description: "Fear & Greed Index", input_schema: { type: "object", properties: {} } },
  { name: "get_bitcoin_onchain", description: "Bitcoin on-chain stats (Blockchair)", input_schema: { type: "object", properties: {} } },
  { name: "get_ethereum_onchain", description: "Ethereum on-chain stats (Blockchair)", input_schema: { type: "object", properties: {} } },
  { name: "get_btc_total_supply", description: "Total BTC supply (Blockchain.info)", input_schema: { type: "object", properties: {} } },
  { name: "get_btc_hashrate", description: "Bitcoin network hashrate (Blockchain.info)", input_schema: { type: "object", properties: {} } },
  { name: "get_active_addresses", description: "Bitcoin active addresses (Glassnode)", input_schema: { type: "object", properties: {} } },
  { name: "get_protocol_revenue", description: "Protocol revenue metrics (TokenTerminal)", input_schema: { type: "object", properties: {} } },
  { name: "get_exchange_flows", description: "Exchange inflow/outflow data (CryptoQuant)", input_schema: { type: "object", properties: {} } },
  { name: "get_crypto_assets", description: "Crypto assets data (Messari)", input_schema: { type: "object", properties: {} } },
  { name: "get_mempool_fees", description: "Bitcoin mempool fees recommended (Mempool.space)", input_schema: { type: "object", properties: {} } },
  { name: "get_mining_pools", description: "Bitcoin mining pool stats (MiningPoolStats)", input_schema: { type: "object", properties: {} } },
  { name: "get_futures_openinterest", description: "Futures open interest (CoinGlass)", input_schema: { type: "object", properties: {} } },
  { name: "get_funding_rates", description: "Perpetual funding rates (CoinGlass)", input_schema: { type: "object", properties: {} } },
  { name: "get_liquidations", description: "Liquidation data (CoinGlass)", input_schema: { type: "object", properties: {} } },
  { name: "get_bybit_spot", description: "Bybit spot trading data (Bybit)", input_schema: { type: "object", properties: {} } },
  { name: "get_gecko_networks", description: "DEX networks (GeckoTerminal)", input_schema: { type: "object", properties: {} } },
  { name: "get_santiment_signals", description: "Social signals (Santiment)", input_schema: { type: "object", properties: {} } },
  { name: "get_coin_rankings", description: "Coin rankings (CoinPaprika)", input_schema: { type: "object", properties: {} } },
  { name: "get_coinrank_markets", description: "Market rankings (CoinRank)", input_schema: { type: "object", properties: {} } },
  { name: "get_nansen_wallets", description: "Top wallet activity (Nansen)", input_schema: { type: "object", properties: {} } },
  { name: "get_okutrade_positions", description: "Options positions (OkuTrade)", input_schema: { type: "object", properties: {} } },
  { name: "get_dune_query", description: "Dune Analytics query (Dune)", input_schema: { type: "object", properties: {} } },
  { name: "get_defipulse_ranking", description: "DeFi protocol ranking (DefiPulse)", input_schema: { type: "object", properties: {} } },
];

async function fetchAPI(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

async function processToolCall(toolName) {
  try {
    switch (toolName) {
      case "get_defi_protocols": return (await fetchAPI("https://api.llama.fi/protocols")).slice(0, 30);
      case "get_blockchain_tvl": return (await fetchAPI("https://api.llama.fi/chains")).slice(0, 30);
      case "get_protocol_fees": return (await fetchAPI("https://api.llama.fi/overview/fees")).slice(0, 20);
      case "get_global_market": return await fetchAPI("https://api.coingecko.com/api/v3/global");
      case "get_trending_coins": return await fetchAPI("https://api.coingecko.com/api/v3/trending");
      case "get_defi_metrics": return await fetchAPI("https://api.coingecko.com/api/v3/global/decentralized_finance_defi");
      case "get_coin_prices": return await fetchAPI("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano,solana,ripple&vs_currencies=usd");
      case "get_market_top_100": return (await fetchAPI("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100")).slice(0, 50);
      case "get_exchange_24h": return (await fetchAPI("https://api.binance.com/api/v3/ticker/24hr")).slice(0, 20);
      case "get_klines": return await fetchAPI("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=30");
      case "get_top_100_cmc": return await fetchAPI("https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=1&limit=100");
      case "get_fear_greed": return await fetchAPI("https://api.alternative.me/fng/");
      case "get_bitcoin_onchain": return await fetchAPI("https://blockchair.com/bitcoin/stats");
      case "get_ethereum_onchain": return await fetchAPI("https://blockchair.com/ethereum/stats");
      case "get_btc_total_supply": return { totalBTC: await fetchAPI("https://blockchain.info/q/totalbtc") };
      case "get_btc_hashrate": return { hashrate: await fetchAPI("https://blockchain.info/q/hashrate") };
      case "get_active_addresses": return await fetchAPI("https://api.glassnode.com/v1/metrics/supply/active_addresses/latest?a=BTC");
      case "get_protocol_revenue": return (await fetchAPI("https://api.tokenterminal.com/v2/projects")).slice(0, 30);
      case "get_exchange_flows": return await fetchAPI("https://api.cryptoquant.com/v1/btc/exchange_flows/latest");
      case "get_crypto_assets": return (await fetchAPI("https://data.messari.io/api/v2/assets?limit=100")).slice(0, 30);
      case "get_mempool_fees": return await fetchAPI("https://mempool.space/api/v1/fees/recommended");
      case "get_mining_pools": return await fetchAPI("https://miningpoolstats.stream/api/v1/pools/btc");
      case "get_futures_openinterest": return await fetchAPI("https://www.coinglass.com/api/futures/openInterest");
      case "get_funding_rates": return await fetchAPI("https://www.coinglass.com/api/futures/fundingRate");
      case "get_liquidations": return await fetchAPI("https://www.coinglass.com/api/futures/liquidation");
      case "get_bybit_spot": return (await fetchAPI("https://api.bybit.com/v5/market/tickers?category=spot&limit=50")).slice(0, 30);
      case "get_gecko_networks": return await fetchAPI("https://api.geckoterminal.com/api/v2/simple/networks");
      case "get_santiment_signals": return await fetchAPI("https://api.santiment.net/graphql");
      case "get_coin_rankings": return (await fetchAPI("https://api.coinpaprika.com/v1/coins")).slice(0, 50);
      case "get_coinrank_markets": return await fetchAPI("https://api.coinrank.io/markets");
      case "get_nansen_wallets": return await fetchAPI("https://api.nansen.ai/v1/wallets/top");
      case "get_okutrade_positions": return await fetchAPI("https://api.okutrade.io/positions");
      case "get_dune_query": return await fetchAPI("https://api.dune.com/api/v1/query");
      case "get_defipulse_ranking": return await fetchAPI("https://data-api.defipulse.com/api/v1/defipulse/api/GetTopProtocolsByTVL");
      default: return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return { error: `${toolName}: ${error.message}` };
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if ((req.url === "/" || req.url === "/mcp") && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });

    req.on("end", async () => {
      try {
        const request = JSON.parse(body);

        if (request.method === "tools/list") {
          res.writeHead(200);
          res.end(JSON.stringify({ tools }));
        } else if (request.method === "tools/call") {
          const result = await processToolCall(request.params.name);
          res.writeHead(200);
          res.end(JSON.stringify({ result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] } }));
        } else {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Unknown method" }));
        }
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`MCP Server on port ${PORT} - 34 tools ready`);
});
