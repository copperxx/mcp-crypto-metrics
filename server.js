#!/usr/bin/env node

import http from "http";

async function fetchCoingecko(endpoint) {
  const response = await fetch(
    `https://api.coingecko.com/api/v3${endpoint}`
  );
  if (!response.ok) throw new Error(`Coingecko API error: ${response.status}`);
  return response.json();
}

async function fetchDefillama(endpoint) {
  const response = await fetch(`https://api.llama.fi${endpoint}`);
  if (!response.ok) throw new Error(`Defillama API error: ${response.status}`);
  return response.json();
}

async function getBtcEthDominance() {
  const data = await fetchCoingecko("/global?include_market_cap_change_percentage=true");
  return {
    btc_dominance: data.data.btc_market_cap_percentage.toFixed(2),
    eth_dominance: data.data.eth_market_cap_percentage.toFixed(2),
    total_market_cap_usd: data.data.total_market_cap.usd.toLocaleString("en-US", { maximumFractionDigits: 0 }),
    total_volume_24h_usd: data.data.total_volume.usd.toLocaleString("en-US", { maximumFractionDigits: 0 }),
  };
}

async function getMarketCapData(limit = 20) {
  const data = await fetchCoingecko(`/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&sparkline=false&price_change_percentage=24h`);
  return data.map((coin) => ({
    rank: coin.market_cap_rank,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    price_usd: coin.current_price,
    market_cap_usd: coin.market_cap ? coin.market_cap.toLocaleString("en-US") : "N/A",
    change_24h: coin.price_change_percentage_24h?.toFixed(2),
    volume_24h_usd: coin.total_volume ? coin.total_volume.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
  }));
}

async function getDefiTvl(limit = 15) {
  const data = await fetchDefillama("/protocols");
  const sorted = data.sort((a, b) => b.tvl - a.tvl).slice(0, limit);
  return sorted.map((protocol) => ({
    name: protocol.name,
    tvl_usd: protocol.tvl ? protocol.tvl.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    change_7d: protocol.change_7d ? protocol.change_7d.toFixed(2) : "N/A",
    category: protocol.category || "N/A",
  }));
}

async function getStakingMetrics() {
  try {
    const eth = await fetchCoingecko("/coins/ethereum");
    return {
      eth_price: eth.market_data.current_price.usd,
      eth_market_cap: eth.market_data.market_cap.usd.toLocaleString("en-US", { maximumFractionDigits: 0 }),
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function getVolumeMetrics(limit = 15) {
  const data = await fetchCoingecko(`/coins/markets?vs_currency=usd&order=volume_desc&per_page=${limit}`);
  return data.map((coin) => ({
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    price: coin.current_price,
    volume_24h: coin.total_volume ? coin.total_volume.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
  }));
}

async function analyzeCycleMetrics() {
  const dominance = await getBtcEthDominance();
  const btc = await fetchCoingecko("/coins/bitcoin?localization=false&market_data=true");
  const eth = await fetchCoingecko("/coins/ethereum?localization=false&market_data=true");
  const mayer_multiple = btc.market_data.current_price.usd / 150000;
  return {
    btc_price: btc.market_data.current_price.usd.toLocaleString("en-US"),
    eth_price: eth.market_data.current_price.usd.toLocaleString("en-US"),
    btc_dominance: dominance.btc_dominance,
    eth_dominance: dominance.eth_dominance,
    mayer_multiple_proxy: mayer_multiple.toFixed(2),
    signal: mayer_multiple < 1 ? "Undervalued" : mayer_multiple > 2.4 ? "Overvalued" : "Fair value",
  };
}

async function getProtocolMetrics(protocol_name) {
  const protocols = await fetchDefillama("/protocols");
  const found = protocols.find((p) => p.name.toLowerCase() === protocol_name.toLowerCase());
  if (!found) return { error: `Protocol ${protocol_name} not found` };
  return {
    name: found.name,
    tvl_usd: found.tvl ? found.tvl.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    change_7d: found.change_7d ? found.change_7d.toFixed(2) : "N/A",
    category: found.category,
  };
}

async function getMarketSummary() {
  const dominance = await getBtcEthDominance();
  return {
    total_market_cap_usd: dominance.total_market_cap_usd,
    total_volume_24h_usd: dominance.total_volume_24h_usd,
    btc_dominance: dominance.btc_dominance,
    eth_dominance: dominance.eth_dominance,
  };
}

async function processToolCall(toolName, toolInput) {
  switch (toolName) {
    case "get_btc_eth_dominance": return await getBtcEthDominance();
    case "get_market_cap_data": return await getMarketCapData(toolInput?.limit || 20);
    case "get_defi_tvl": return await getDefiTvl(toolInput?.limit || 15);
    case "get_staking_metrics": return await getStakingMetrics();
    case "get_volume_metrics": return await getVolumeMetrics(toolInput?.limit || 15);
    case "analyze_cycle_metrics": return await analyzeCycleMetrics();
    case "get_protocol_metrics": return await getProtocolMetrics(toolInput?.protocol_name || "Aave");
    case "get_market_summary": return await getMarketSummary();
    default: return { error: `Unknown tool: ${toolName}` };
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
              serverInfo: { name: "mcp-crypto-metrics", version: "1.0.0" },
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
                { name: "get_btc_eth_dominance", description: "Get BTC/ETH dominance", inputSchema: { type: "object", properties: {} } },
                { name: "get_market_cap_data", description: "Top coins by market cap", inputSchema: { type: "object", properties: { limit: { type: "number" } } } },
                { name: "get_defi_tvl", description: "DeFi protocols TVL", inputSchema: { type: "object", properties: { limit: { type: "number" } } } },
                { name: "get_staking_metrics", description: "ETH staking", inputSchema: { type: "object", properties: {} } },
                { name: "get_volume_metrics", description: "Trading volume leaders", inputSchema: { type: "object", properties: { limit: { type: "number" } } } },
                { name: "analyze_cycle_metrics", description: "BTC/ETH cycle analysis", inputSchema: { type: "object", properties: {} } },
                { name: "get_protocol_metrics", description: "Specific protocol metrics", inputSchema: { type: "object", properties: { protocol_name: { type: "string" } } } },
                { name: "get_market_summary", description: "Market summary", inputSchema: { type: "object", properties: {} } },
              ],
            },
          }));
          return;
        }
        if (request.method === "tools/call") {
          try {
            const result = await processToolCall(request.params.name, request.params.arguments);
            res.writeHead(200);
            res.end(JSON.stringify({
              jsonrpc: "2.0",
              id: request.id,
              result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] },
            }));
          } catch (error) {
            res.writeHead(200);
            res.end(JSON.stringify({
              jsonrpc: "2.0",
              id: request.id,
              error: { code: -32603, message: error.message },
            }));
          }
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
  console.log(`MCP Server listening on port ${PORT}`);
});
