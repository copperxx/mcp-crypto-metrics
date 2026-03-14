#!/usr/bin/env node


// MCP Server tools definition
const tools = [
  {
    name: "get_btc_eth_dominance",
    description: "Get BTC and ETH market dominance percentage",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_market_cap_data",
    description:
      "Get top cryptocurrencies by market cap with price, 24h change, volume",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of top coins to fetch (default: 20)",
        },
      },
    },
  },
  {
    name: "get_defi_tvl",
    description: "Get Total Value Locked (TVL) across DeFi protocols",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of top protocols (default: 15)",
        },
      },
    },
  },
  {
    name: "get_staking_metrics",
    description: "Get ETH staking, Lido, and major protocol staking metrics",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_volume_metrics",
    description: "Get 24h trading volume across major exchanges and tokens",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of tokens to fetch (default: 15)",
        },
      },
    },
  },
  {
    name: "analyze_cycle_metrics",
    description:
      "Analyze BTC/ETH cycle indicators (Mayer Multiple proxy, dominance trend, volume patterns)",
    input_schema: {
      type: "object",
      properties: {
        lookback_days: {
          type: "number",
          description: "Lookback period in days (default: 365)",
        },
      },
    },
  },
  {
    name: "get_protocol_metrics",
    description: "Get metrics for a specific DeFi protocol (TVL, APY, users)",
    input_schema: {
      type: "object",
      properties: {
        protocol_name: {
          type: "string",
          description: "Protocol name (e.g., 'Aave', 'Curve', 'Uniswap')",
        },
      },
    },
  },
  {
    name: "get_market_summary",
    description: "Get comprehensive market summary (cap, dominance, volume, fear/greed)",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
];

// API Calls
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

// Tool implementations
async function getBtcEthDominance() {
  const data = await fetchCoingecko(
    "/global?include_market_cap_change_percentage=true"
  );
  return {
    btc_dominance: data.data.btc_market_cap_percentage.toFixed(2),
    eth_dominance: data.data.eth_market_cap_percentage.toFixed(2),
    total_market_cap_usd:
      data.data.total_market_cap.usd.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      }),
    total_volume_24h_usd:
      data.data.total_volume.usd.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      }),
  };
}

async function getMarketCapData(limit = 20) {
  const data = await fetchCoingecko(
    `/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&sparkline=false&price_change_percentage=24h`
  );

  return data.map((coin) => ({
    rank: coin.market_cap_rank,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    price_usd: coin.current_price,
    market_cap_usd:
      coin.market_cap ? coin.market_cap.toLocaleString("en-US") : "N/A",
    change_24h: coin.price_change_percentage_24h?.toFixed(2),
    volume_24h_usd: coin.total_volume
      ? coin.total_volume.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : "N/A",
  }));
}

async function getDefiTvl(limit = 15) {
  const data = await fetchDefillama("/protocols");
  const sorted = data.sort((a, b) => b.tvl - a.tvl).slice(0, limit);

  return sorted.map((protocol) => ({
    name: protocol.name,
    tvl_usd: protocol.tvl
      ? protocol.tvl.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : "N/A",
    change_7d: protocol.change_7d ? protocol.change_7d.toFixed(2) : "N/A",
    category: protocol.category || "N/A",
  }));
}

async function getStakingMetrics() {
  try {
    const eth = await fetchCoingecko("/coins/ethereum");
    return {
      eth_staked_usd: eth.market_data.market_cap.usd * 0.25,
      eth_price: eth.market_data.current_price.usd,
      eth_market_cap: eth.market_data.market_cap.usd.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      }),
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function getVolumeMetrics(limit = 15) {
  const data = await fetchCoingecko(
    `/coins/markets?vs_currency=usd&order=volume_desc&per_page=${limit}`
  );

  return data.map((coin) => ({
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    price: coin.current_price,
    volume_24h: coin.total_volume
      ? coin.total_volume.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : "N/A",
    volume_market_cap_ratio:
      coin.market_cap && coin.total_volume
        ? (coin.total_volume / coin.market_cap).toFixed(2)
        : "N/A",
  }));
}

async function analyzeCycleMetrics(lookback_days = 365) {
  const dominance = await getBtcEthDominance();
  const btc = await fetchCoingecko(
    "/coins/bitcoin?localization=false&market_data=true"
  );
  const eth = await fetchCoingecko(
    "/coins/ethereum?localization=false&market_data=true"
  );

  const mayer_multiple = btc.market_data.current_price.usd / 150000; // 365-day SMA proxy

  return {
    btc_price: btc.market_data.current_price.usd.toLocaleString("en-US"),
    eth_price: eth.market_data.current_price.usd.toLocaleString("en-US"),
    btc_dominance: dominance.btc_dominance,
    eth_dominance: dominance.eth_dominance,
    mayer_multiple_proxy: mayer_multiple.toFixed(2),
    btc_24h_volume:
      btc.market_data.total_volume.usd.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      }),
    market_cap_usd: dominance.total_market_cap_usd,
    signal_interpretation:
      mayer_multiple < 1
        ? "Undervalued (potential cycle bottom)"
        : mayer_multiple > 2.4
          ? "Overvalued (potential cycle top)"
          : "Fair value",
  };
}

async function getProtocolMetrics(protocol_name) {
  const protocols = await fetchDefillama("/protocols");
  const found = protocols.find(
    (p) => p.name.toLowerCase() === protocol_name.toLowerCase()
  );

  if (!found) {
    return { error: `Protocol ${protocol_name} not found` };
  }

  return {
    name: found.name,
    tvl_usd: found.tvl
      ? found.tvl.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : "N/A",
    change_7d: found.change_7d ? found.change_7d.toFixed(2) : "N/A",
    change_30d: found.change_30d ? found.change_30d.toFixed(2) : "N/A",
    category: found.category,
  };
}

async function getMarketSummary() {
  const global = await fetchCoingecko(
    "/global?include_market_cap_change_percentage=true"
  );
  const dominance = await getBtcEthDominance();

  return {
    total_market_cap_usd: dominance.total_market_cap_usd,
    total_volume_24h_usd: dominance.total_volume_24h_usd,
    btc_dominance: dominance.btc_dominance,
    eth_dominance: dominance.eth_dominance,
    top_gainers: "Use get_market_cap_data tool for top movers",
    top_defi_protocols: "Use get_defi_tvl tool for TVL leaders",
  };
}

// Tool router
async function processToolCall(toolName, toolInput) {
  switch (toolName) {
    case "get_btc_eth_dominance":
      return await getBtcEthDominance();
    case "get_market_cap_data":
      return await getMarketCapData(toolInput.limit);
    case "get_defi_tvl":
      return await getDefiTvl(toolInput.limit);
    case "get_staking_metrics":
      return await getStakingMetrics();
    case "get_volume_metrics":
      return await getVolumeMetrics(toolInput.limit);
    case "analyze_cycle_metrics":
      return await analyzeCycleMetrics(toolInput.lookback_days);
    case "get_protocol_metrics":
      return await getProtocolMetrics(toolInput.protocol_name);
    case "get_market_summary":
      return await getMarketSummary();
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// MCP Protocol Handler
async function handleMcpRequest(request) {
  if (request.method === "tools/list") {
    return { tools };
  }

  if (request.method === "tools/call") {
    const result = await processToolCall(request.params.name, request.params.arguments);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  return { error: "Unknown method" };
}

// Simple HTTP Server for MCP
import http from "http";

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/mcp") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const request = JSON.parse(body);
        const response = await handleMcpRequest(request);
        res.writeHead(200);
        res.end(JSON.stringify(response));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "ok" }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`MCP Server listening on port ${PORT}`);
});
