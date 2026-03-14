#!/usr/bin/env node

import http from "http";

async function fetchDefillama(endpoint) {
  const response = await fetch(`https://api.llama.fi${endpoint}`);
  if (!response.ok) throw new Error(`Defillama API error: ${response.status}`);
  return response.json();
}

async function fetchGeckoTerminal(endpoint) {
  const response = await fetch(`https://api.geckoterminal.com/api/v2${endpoint}`);
  if (!response.ok) throw new Error(`GeckoTerminal API error: ${response.status}`);
  return response.json();
}

// Defillama tools
async function getDefiTvl(limit = 15) {
  const data = await fetchDefillama("/protocols");
  const sorted = data.sort((a, b) => b.tvl - a.tvl).slice(0, limit);
  return sorted.map((protocol) => ({
    name: protocol.name,
    tvl_usd: protocol.tvl ? protocol.tvl.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    change_7d: protocol.change_7d ? protocol.change_7d.toFixed(2) : "N/A",
    change_30d: protocol.change_30d ? protocol.change_30d.toFixed(2) : "N/A",
    category: protocol.category || "N/A",
  }));
}

async function getProtocolMetrics(protocol_name) {
  const protocols = await fetchDefillama("/protocols");
  const found = protocols.find((p) => p.name.toLowerCase() === protocol_name.toLowerCase());
  if (!found) return { error: `Protocol ${protocol_name} not found` };
  return {
    name: found.name,
    tvl_usd: found.tvl ? found.tvl.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    change_7d: found.change_7d ? found.change_7d.toFixed(2) : "N/A",
    change_30d: found.change_30d ? found.change_30d.toFixed(2) : "N/A",
    category: found.category,
  };
}

async function getDefiChains() {
  const data = await fetchDefillama("/chains");
  return data.map((chain) => ({
    name: chain.name,
    tvl_usd: chain.tvl ? chain.tvl.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    change_7d: chain.change7d ? chain.change7d.toFixed(2) : "N/A",
  }));
}

// GeckoTerminal tools
async function getDexData(network = "ethereum") {
  const data = await fetchGeckoTerminal(`/networks/${network}/dexes`);
  return data.data.slice(0, 10).map((dex) => ({
    name: dex.attributes.name,
    network: network,
    trade_24h: dex.attributes.trade_volume_24h_usd ? dex.attributes.trade_volume_24h_usd.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
  }));
}

async function getTopTokens(network = "ethereum", limit = 15) {
  const data = await fetchGeckoTerminal(`/networks/${network}/tokens?page=1&limit=${limit}`);
  return data.data.map((token) => ({
    name: token.attributes.name,
    symbol: token.attributes.symbol.toUpperCase(),
    price_usd: token.attributes.price_usd ? parseFloat(token.attributes.price_usd).toFixed(2) : "N/A",
    market_cap: token.attributes.market_cap_usd ? token.attributes.market_cap_usd.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    volume_24h: token.attributes.trading_volume_24h_usd ? token.attributes.trading_volume_24h_usd.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
  }));
}

async function getTopPools(network = "ethereum", limit = 15) {
  const data = await fetchGeckoTerminal(`/networks/${network}/pools?page=1&limit=${limit}`);
  return data.data.map((pool) => ({
    name: pool.attributes.name,
    base_token: pool.attributes.base_token_symbol,
    quote_token: pool.attributes.quote_token_symbol,
    tvl: pool.attributes.reserve_in_usd ? pool.attributes.reserve_in_usd.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A",
    volume_24h: pool.attributes.volume_usd ? pool.attributes.volume_usd.get24h ? pool.attributes.volume_usd.get24h.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "N/A" : "N/A",
  }));
}

async function processToolCall(toolName, toolInput) {
  switch (toolName) {
    case "get_defi_tvl": return await getDefiTvl(toolInput?.limit || 15);
    case "get_protocol_metrics": return await getProtocolMetrics(toolInput?.protocol_name || "Aave");
    case "get_defi_chains": return await getDefiChains();
    case "get_dex_data": return await getDexData(toolInput?.network || "ethereum");
    case "get_top_tokens": return await getTopTokens(toolInput?.network || "ethereum", toolInput?.limit || 15);
    case "get_top_pools": return await getTopPools(toolInput?.network || "ethereum", toolInput?.limit || 15);
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
              serverInfo: { name: "mcp-crypto-metrics", version: "2.0.0" },
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
                { name: "get_defi_tvl", description: "Top DeFi protocols by TVL", inputSchema: { type: "object", properties: { limit: { type: "number" } } } },
                { name: "get_protocol_metrics", description: "Specific protocol metrics (Aave, Curve, etc.)", inputSchema: { type: "object", properties: { protocol_name: { type: "string" } } } },
                { name: "get_defi_chains", description: "DeFi TVL by blockchain", inputSchema: { type: "object", properties: {} } },
                { name: "get_dex_data", description: "DEX trading volume by network (Ethereum, Solana, etc.)", inputSchema: { type: "object", properties: { network: { type: "string" } } } },
                { name: "get_top_tokens", description: "Top tokens by market cap on a network", inputSchema: { type: "object", properties: { network: { type: "string" }, limit: { type: "number" } } } },
                { name: "get_top_pools", description: "Top liquidity pools on a DEX", inputSchema: { type: "object", properties: { network: { type: "string" }, limit: { type: "number" } } } },
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
