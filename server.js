#!/usr/bin/env node
import http from "http";

async function fetchDefillama(endpoint) {
  const response = await fetch(`https://api.llama.fi${endpoint}`);
  if (!response.ok) throw new Error(`Defillama error: ${response.status}`);
  return response.json();
}

// 1. All Protocols
async function getAllProtocols() {
  const data = await fetchDefillama("/protocols");
  return data.slice(0, 100).map(p => ({
    name: p.name,
    category: p.category,
    tvl: p.tvl ? parseFloat(p.tvl).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    change_1h: p.change_1h?.toFixed(2),
    change_7d: p.change_7d?.toFixed(2),
    change_30d: p.change_30d?.toFixed(2),
  }));
}

// 2. Protocol Detail
async function getProtocolDetail(protocol) {
  const data = await fetchDefillama(`/protocol/${protocol}`);
  return {
    name: data.name,
    category: data.category,
    tvl: data.tvl ? parseFloat(data.tvl).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    change_1h: data.change_1h?.toFixed(2),
    change_7d: data.change_7d?.toFixed(2),
    change_30d: data.change_30d?.toFixed(2),
    tvl_by_chain: Object.entries(data.chainTvls || {}).map(([chain, tvl]) => ({
      chain,
      tvl: tvl ? parseFloat(tvl).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    })).slice(0, 20),
  };
}

// 3. All Chains
async function getAllChains() {
  const data = await fetchDefillama("/chains");
  return data.map(c => ({
    name: c.name,
    tvl: c.tvl ? parseFloat(c.tvl).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    change_1h: c.change_1h?.toFixed(2),
    change_7d: c.change_7d?.toFixed(2),
    change_30d: c.change_30d?.toFixed(2),
  }));
}

// 4. Chain Detail
async function getChainTvl(chain) {
  const data = await fetchDefillama(`/chain/${chain}`);
  return {
    name: data.name,
    tvl: data.tvl ? parseFloat(data.tvl).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    protocols: data.protocols?.slice(0, 30).map(p => ({
      name: p.name,
      tvl: p.tvl ? parseFloat(p.tvl).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
      category: p.category,
    })) || [],
  };
}

// 5. Protocol Historical TVL
async function getProtocolHistory(protocol) {
  const data = await fetchDefillama(`/chart/${protocol}`);
  return {
    protocol,
    data: data.slice(-60).map(item => ({
      date: new Date(item[0] * 1000).toISOString().split('T')[0],
      tvl: item[1] ? parseFloat(item[1]).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    })),
  };
}

// 6. Chain Historical TVL
async function getChainHistory(chain) {
  const data = await fetchDefillama(`/chainChart/${chain}`);
  return {
    chain,
    data: data.slice(-60).map(item => ({
      date: new Date(item[0] * 1000).toISOString().split('T')[0],
      tvl: item[1] ? parseFloat(item[1]).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    })),
  };
}

// 7. DEX Volumes
async function getDexVolumes() {
  const data = await fetchDefillama("/overview/dexs");
  return {
    totalVolume24h: data.totalVolume24h ? parseFloat(data.totalVolume24h).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    change_1d: data.change_1d?.toFixed(2),
    dexes: data.dexs?.slice(0, 50).map(d => ({
      name: d.name,
      displayName: d.displayName,
      volume24h: d.volume24h ? parseFloat(d.volume24h).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
      chains: d.chains?.join(", "),
    })) || [],
  };
}

// 8. Coin Prices
async function getCoinPrices(coins = ["ethereum", "solana", "binancecoin"]) {
  const coinsList = coins.join(",");
  const data = await fetchDefillama(`/prices?coins=${coinsList}`);
  return Object.entries(data.coins || {}).map(([key, price]) => ({
    coin: key,
    price: price.price?.toFixed(2),
    symbol: price.symbol,
  }));
}

// 9. Fees & Revenue
async function getFeesOverview() {
  const data = await fetchDefillama("/overview/fees");
  return {
    totalFees24h: data.totalFees24h ? parseFloat(data.totalFees24h).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    totalRevenue24h: data.totalRevenue24h ? parseFloat(data.totalRevenue24h).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    change_1d: data.change_1d?.toFixed(2),
    protocols: data.protocols?.slice(0, 50).map(p => ({
      name: p.name,
      fees24h: p.fees24h ? parseFloat(p.fees24h).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
      revenue24h: p.revenue24h ? parseFloat(p.revenue24h).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
      chains: p.chains?.join(", "),
    })) || [],
  };
}

// 10. All Stablecoins
async function getAllStablecoins() {
  const data = await fetchDefillama("/stablecoins");
  return data.slice(0, 50).map(s => ({
    name: s.name,
    symbol: s.symbol,
    chains: s.chains?.join(", "),
    total_supply: s.total_supply?.usd ? parseFloat(s.total_supply.usd).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    mcap: s.mcap?.usd ? parseFloat(s.mcap.usd).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
  }));
}

// 11. Yields Pools
async function getYieldsPools(limit = 50) {
  const data = await fetchDefillama("/pools");
  return data.data.slice(0, limit).map(p => ({
    pool: p.pool,
    project: p.project,
    symbol: p.symbol,
    chain: p.chain,
    tvl: p.tvlUsd ? parseFloat(p.tvlUsd).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    apy: p.apy?.toFixed(2),
    apyBase: p.apyBase?.toFixed(2),
    apyReward: p.apyReward?.toFixed(2),
  }));
}

// 12. Bridges
async function getBridges() {
  const data = await fetchDefillama("/bridges");
  return data.slice(0, 50).map(b => ({
    name: b.name,
    displayName: b.displayName,
    chains: b.chains?.join(", "),
    tvl: b.tvl ? parseFloat(b.tvl).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    amount_24h: b.amount_24h ? parseFloat(b.amount_24h).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    change_1d: b.change_1d?.toFixed(2),
  }));
}

// 13. Stablecoin Historical MCap
async function getStablecoinHistory(chain = "all") {
  const data = await fetchDefillama(`/stablecoincharts/${chain}`);
  return {
    chain,
    data: data.slice(-60).map(item => ({
      date: new Date(item[0] * 1000).toISOString().split('T')[0],
      total_mcap: item[1] ? parseFloat(item[1]).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    })),
  };
}

async function processToolCall(toolName, toolInput) {
  try {
    switch (toolName) {
      case "get_all_protocols": return await getAllProtocols();
      case "get_protocol_detail": return await getProtocolDetail(toolInput?.protocol || "aave");
      case "get_all_chains": return await getAllChains();
      case "get_chain_tvl": return await getChainTvl(toolInput?.chain || "Ethereum");
      case "get_protocol_history": return await getProtocolHistory(toolInput?.protocol || "aave");
      case "get_chain_history": return await getChainHistory(toolInput?.chain || "Ethereum");
      case "get_dex_volumes": return await getDexVolumes();
      case "get_coin_prices": return await getCoinPrices(toolInput?.coins || ["ethereum", "solana", "binancecoin"]);
      case "get_fees_overview": return await getFeesOverview();
      case "get_all_stablecoins": return await getAllStablecoins();
      case "get_yields_pools": return await getYieldsPools(toolInput?.limit || 50);
      case "get_bridges": return await getBridges();
      case "get_stablecoin_history": return await getStablecoinHistory(toolInput?.chain || "all");
      default: return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return { error: error.message };
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.method === "POST" && req.url === "/") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        const request = JSON.parse(body);
        if (request.jsonrpc === "2.0" && request.method === "initialize") {
          res.writeHead(200);
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id: request.id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: { tools: {} },
              serverInfo: { name: "defillama-mcp", version: "4.0.0" },
            },
          }));
          return;
        }
        if (request.method === "tools/list") {
          res.writeHead(200);
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id: request.id,
            result: {
              tools: [
                { name: "get_all_protocols", description: "All DeFi protocols with TVL & changes", inputSchema: { type: "object", properties: {} } },
                { name: "get_protocol_detail", description: "Protocol detail: TVL by chain/token", inputSchema: { type: "object", properties: { protocol: { type: "string" } } } },
                { name: "get_all_chains", description: "All blockchains with TVL", inputSchema: { type: "object", properties: {} } },
                { name: "get_chain_tvl", description: "Specific chain TVL & protocols", inputSchema: { type: "object", properties: { chain: { type: "string" } } } },
                { name: "get_protocol_history", description: "Protocol TVL history (60d)", inputSchema: { type: "object", properties: { protocol: { type: "string" } } } },
                { name: "get_chain_history", description: "Chain TVL history (60d)", inputSchema: { type: "object", properties: { chain: { type: "string" } } } },
                { name: "get_dex_volumes", description: "DEX trading volumes (24h)", inputSchema: { type: "object", properties: {} } },
                { name: "get_coin_prices", description: "Token prices (Ethereum, Solana, etc.)", inputSchema: { type: "object", properties: { coins: { type: "array" } } } },
                { name: "get_fees_overview", description: "All protocols fees & revenue (24h)", inputSchema: { type: "object", properties: {} } },
                { name: "get_all_stablecoins", description: "Stablecoins with supply & mcap", inputSchema: { type: "object", properties: {} } },
                { name: "get_yields_pools", description: "Yield farming pools with APY", inputSchema: { type: "object", properties: { limit: { type: "number" } } } },
                { name: "get_bridges", description: "Cross-chain bridges TVL & volume", inputSchema: { type: "object", properties: {} } },
                { name: "get_stablecoin_history", description: "Stablecoin MCap history (60d)", inputSchema: { type: "object", properties: { chain: { type: "string" } } } },
              ],
            },
          }));
          return;
        }
        if (request.method === "tools/call") {
          const result = await processToolCall(request.params.name, request.params.arguments);
          res.writeHead(200);
          res.end(JSON.stringify({
            jsonrpc: "2.0",
            id: request.id,
            result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] },
          }));
          return;
        }
        res.writeHead(200);
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          id: request.id,
          error: { code: -32601, message: "Method not found" },
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32700, message: "Parse error" },
        }));
      }
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Defillama MCP Server v4.0.0 listening on port ${PORT}`);
});
