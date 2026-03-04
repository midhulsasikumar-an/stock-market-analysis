/**
 * stocksData.js
 * =============
 * Comprehensive sector + stock directory.
 * Prices/changes shown here are static seed data only — the live SectorPage
 * fetches real-time quotes from Finnhub to display alongside these.
 *
 * To add more stocks: just push { symbol, companyName } to any sector's
 * stocks array. Prices are fetched live so static values are ignored in UI.
 */

export const STOCK_SECTORS = [
  {
    id: "information-technology",
    name: "Information Technology",
    icon: "💻",
    description: "Software, hardware, semiconductors, and IT services",
    performance: 3.9,
    totalMarketCap: 14200000000000,
    stocks: [
      { symbol: "AAPL", companyName: "Apple Inc." },
      { symbol: "MSFT", companyName: "Microsoft Corp." },
      { symbol: "NVDA", companyName: "NVIDIA Corp." },
      { symbol: "ORCL", companyName: "Oracle Corp." },
      { symbol: "CRM", companyName: "Salesforce Inc." },
      { symbol: "ADBE", companyName: "Adobe Inc." },
      { symbol: "INTC", companyName: "Intel Corp." },
      { symbol: "AMD", companyName: "Advanced Micro Devices" },
      { symbol: "QCOM", companyName: "Qualcomm Inc." },
      { symbol: "TXN", companyName: "Texas Instruments Inc." },
      { symbol: "IBM", companyName: "IBM Corp." },
      { symbol: "NOW", companyName: "ServiceNow Inc." },
      { symbol: "SNOW", companyName: "Snowflake Inc." },
      { symbol: "PLTR", companyName: "Palantir Technologies" },
      { symbol: "MRVL", companyName: "Marvell Technology" },
    ],
  },
  {
    id: "electronics",
    name: "Electronics & Hardware",
    icon: "🔌",
    description: "Consumer electronics, display tech, and hardware manufacturers",
    performance: 2.6,
    totalMarketCap: 3200000000000,
    stocks: [
      { symbol: "SONY", companyName: "Sony Group Corp." },
      { symbol: "HPQ", companyName: "HP Inc." },
      { symbol: "HPE", companyName: "Hewlett Packard Enterprise" },
      { symbol: "DELL", companyName: "Dell Technologies" },
      { symbol: "STX", companyName: "Seagate Technology" },
      { symbol: "WDC", companyName: "Western Digital Corp." },
      { symbol: "AMAT", companyName: "Applied Materials Inc." },
      { symbol: "LRCX", companyName: "Lam Research Corp." },
      { symbol: "KLAC", companyName: "KLA Corp." },
      { symbol: "MU", companyName: "Micron Technology" },
    ],
  },
  {
    id: "banking-finance",
    name: "Banking & Finance",
    icon: "🏦",
    description: "Banks, insurance, investment firms, and fintech",
    performance: 1.1,
    totalMarketCap: 5400000000000,
    stocks: [
      { symbol: "JPM", companyName: "JPMorgan Chase & Co." },
      { symbol: "BAC", companyName: "Bank of America Corp." },
      { symbol: "GS", companyName: "Goldman Sachs Group Inc." },
      { symbol: "MS", companyName: "Morgan Stanley" },
      { symbol: "WFC", companyName: "Wells Fargo & Co." },
      { symbol: "C", companyName: "Citigroup Inc." },
      { symbol: "BLK", companyName: "BlackRock Inc." },
      { symbol: "SCHW", companyName: "Charles Schwab Corp." },
      { symbol: "AXP", companyName: "American Express Co." },
      { symbol: "V", companyName: "Visa Inc." },
      { symbol: "MA", companyName: "Mastercard Inc." },
      { symbol: "PYPL", companyName: "PayPal Holdings Inc." },
      { symbol: "SQ", companyName: "Block Inc." },
      { symbol: "COF", companyName: "Capital One Financial" },
      { symbol: "USB", companyName: "US Bancorp" },
    ],
  },
  {
    id: "healthcare",
    name: "Healthcare & Biotech",
    icon: "🏥",
    description: "Pharmaceuticals, medical devices, hospitals, and biotech",
    performance: -0.8,
    totalMarketCap: 4700000000000,
    stocks: [
      { symbol: "JNJ", companyName: "Johnson & Johnson" },
      { symbol: "PFE", companyName: "Pfizer Inc." },
      { symbol: "UNH", companyName: "UnitedHealth Group Inc." },
      { symbol: "ABBV", companyName: "AbbVie Inc." },
      { symbol: "MRK", companyName: "Merck & Co. Inc." },
      { symbol: "LLY", companyName: "Eli Lilly and Co." },
      { symbol: "TMO", companyName: "Thermo Fisher Scientific" },
      { symbol: "ABT", companyName: "Abbott Laboratories" },
      { symbol: "BMY", companyName: "Bristol-Myers Squibb" },
      { symbol: "AMGN", companyName: "Amgen Inc." },
      { symbol: "GILD", companyName: "Gilead Sciences Inc." },
      { symbol: "REGN", companyName: "Regeneron Pharmaceuticals" },
      { symbol: "BIIB", companyName: "Biogen Inc." },
      { symbol: "MRNA", companyName: "Moderna Inc." },
      { symbol: "ISRG", companyName: "Intuitive Surgical Inc." },
    ],
  },
  {
    id: "automobile",
    name: "Automobile & EV",
    icon: "🚗",
    description: "Traditional automakers and electric vehicle manufacturers",
    performance: 0.6,
    totalMarketCap: 1900000000000,
    stocks: [
      { symbol: "TSLA", companyName: "Tesla Inc." },
      { symbol: "F", companyName: "Ford Motor Co." },
      { symbol: "GM", companyName: "General Motors Co." },
      { symbol: "RIVN", companyName: "Rivian Automotive" },
      { symbol: "LCID", companyName: "Lucid Group Inc." },
      { symbol: "NIO", companyName: "NIO Inc." },
      { symbol: "LI", companyName: "Li Auto Inc." },
      { symbol: "TM", companyName: "Toyota Motor Corp." },
      { symbol: "HMC", companyName: "Honda Motor Co." },
      { symbol: "STLA", companyName: "Stellantis N.V." },
    ],
  },
  {
    id: "energy",
    name: "Energy & Oil",
    icon: "⚡",
    description: "Oil & gas, renewables, utilities, and clean energy",
    performance: -1.5,
    totalMarketCap: 3600000000000,
    stocks: [
      { symbol: "XOM", companyName: "Exxon Mobil Corp." },
      { symbol: "CVX", companyName: "Chevron Corp." },
      { symbol: "SLB", companyName: "SLB (Schlumberger)" },
      { symbol: "COP", companyName: "ConocoPhillips" },
      { symbol: "EOG", companyName: "EOG Resources Inc." },
      { symbol: "PSX", companyName: "Phillips 66" },
      { symbol: "MPC", companyName: "Marathon Petroleum" },
      { symbol: "OXY", companyName: "Occidental Petroleum" },
      { symbol: "HAL", companyName: "Halliburton Co." },
      { symbol: "NEE", companyName: "NextEra Energy Inc." },
      { symbol: "ENPH", companyName: "Enphase Energy Inc." },
      { symbol: "FSLR", companyName: "First Solar Inc." },
    ],
  },
  {
    id: "consumer-goods",
    name: "Consumer Goods & Retail",
    icon: "🛒",
    description: "Everyday consumer products, food, beverages, and retail chains",
    performance: 1.9,
    totalMarketCap: 4200000000000,
    stocks: [
      { symbol: "PG", companyName: "Procter & Gamble Co." },
      { symbol: "KO", companyName: "Coca-Cola Co." },
      { symbol: "PEP", companyName: "PepsiCo Inc." },
      { symbol: "WMT", companyName: "Walmart Inc." },
      { symbol: "COST", companyName: "Costco Wholesale Corp." },
      { symbol: "TGT", companyName: "Target Corp." },
      { symbol: "AMZN", companyName: "Amazon.com Inc." },
      { symbol: "HD", companyName: "The Home Depot Inc." },
      { symbol: "LOW", companyName: "Lowe's Companies Inc." },
      { symbol: "MCD", companyName: "McDonald's Corp." },
      { symbol: "SBUX", companyName: "Starbucks Corp." },
      { symbol: "NKE", companyName: "Nike Inc." },
      { symbol: "CL", companyName: "Colgate-Palmolive" },
      { symbol: "KHC", companyName: "Kraft Heinz Co." },
      { symbol: "MDLZ", companyName: "Mondelez International" },
    ],
  },
  {
    id: "telecommunications",
    name: "Telecommunications",
    icon: "📡",
    description: "Mobile carriers, broadband, and communications infrastructure",
    performance: 0.3,
    totalMarketCap: 1700000000000,
    stocks: [
      { symbol: "VZ", companyName: "Verizon Communications Inc." },
      { symbol: "T", companyName: "AT&T Inc." },
      { symbol: "TMUS", companyName: "T-Mobile US Inc." },
      { symbol: "DISH", companyName: "DISH Network Corp." },
      { symbol: "LUMN", companyName: "Lumen Technologies" },
      { symbol: "AMT", companyName: "American Tower Corp." },
      { symbol: "CCI", companyName: "Crown Castle Inc." },
      { symbol: "SBAC", companyName: "SBA Communications" },
    ],
  },
  {
    id: "media-entertainment",
    name: "Media & Entertainment",
    icon: "🎬",
    description: "Streaming, gaming, social media, and traditional media",
    performance: 2.1,
    totalMarketCap: 3100000000000,
    stocks: [
      { symbol: "META", companyName: "Meta Platforms Inc." },
      { symbol: "GOOGL", companyName: "Alphabet Inc. (Google)" },
      { symbol: "NFLX", companyName: "Netflix Inc." },
      { symbol: "DIS", companyName: "Walt Disney Co." },
      { symbol: "PARA", companyName: "Paramount Global" },
      { symbol: "WBD", companyName: "Warner Bros. Discovery" },
      { symbol: "SPOT", companyName: "Spotify Technology" },
      { symbol: "EA", companyName: "Electronic Arts Inc." },
      { symbol: "TTWO", companyName: "Take-Two Interactive" },
      { symbol: "RBLX", companyName: "Roblox Corp." },
      { symbol: "SNAP", companyName: "Snap Inc." },
      { symbol: "PINS", companyName: "Pinterest Inc." },
    ],
  },
  {
    id: "aerospace-defense",
    name: "Aerospace & Defense",
    icon: "🚀",
    description: "Defense contractors, aviation, satellites, and space tech",
    performance: 1.4,
    totalMarketCap: 2300000000000,
    stocks: [
      { symbol: "LMT", companyName: "Lockheed Martin Corp." },
      { symbol: "RTX", companyName: "RTX Corp. (Raytheon)" },
      { symbol: "NOC", companyName: "Northrop Grumman Corp." },
      { symbol: "GD", companyName: "General Dynamics Corp." },
      { symbol: "BA", companyName: "Boeing Co." },
      { symbol: "HII", companyName: "Huntington Ingalls Industries" },
      { symbol: "L3H", companyName: "L3Harris Technologies" },
      { symbol: "TDG", companyName: "TransDigm Group Inc." },
      { symbol: "SPCE", companyName: "Virgin Galactic Holdings" },
      { symbol: "RKLB", companyName: "Rocket Lab USA Inc." },
    ],
  },
  {
    id: "real-estate",
    name: "Real Estate (REITs)",
    icon: "🏢",
    description: "Real estate investment trusts, property, and infrastructure REITs",
    performance: -0.4,
    totalMarketCap: 1200000000000,
    stocks: [
      { symbol: "PLD", companyName: "Prologis Inc." },
      { symbol: "O", companyName: "Realty Income Corp." },
      { symbol: "SPG", companyName: "Simon Property Group" },
      { symbol: "EQIX", companyName: "Equinix Inc." },
      { symbol: "DLR", companyName: "Digital Realty Trust" },
      { symbol: "PSA", companyName: "Public Storage" },
      { symbol: "AVB", companyName: "AvalonBay Communities" },
      { symbol: "EQR", companyName: "Equity Residential" },
      { symbol: "WELL", companyName: "Welltower Inc." },
      { symbol: "VTR", companyName: "Ventas Inc." },
    ],
  },
  {
    id: "cloud-saas",
    name: "Cloud & SaaS",
    icon: "☁️",
    description: "Cloud platforms, SaaS providers, and enterprise software",
    performance: 4.2,
    totalMarketCap: 5800000000000,
    stocks: [
      { symbol: "MSFT", companyName: "Microsoft (Azure)" },
      { symbol: "AMZN", companyName: "Amazon (AWS)" },
      { symbol: "GOOG", companyName: "Alphabet (Google Cloud)" },
      { symbol: "CRM", companyName: "Salesforce Inc." },
      { symbol: "WDAY", companyName: "Workday Inc." },
      { symbol: "NOW", companyName: "ServiceNow Inc." },
      { symbol: "ZM", companyName: "Zoom Video Communications" },
      { symbol: "TEAM", companyName: "Atlassian Corp." },
      { symbol: "MDB", companyName: "MongoDB Inc." },
      { symbol: "DDOG", companyName: "Datadog Inc." },
      { symbol: "NET", companyName: "Cloudflare Inc." },
      { symbol: "ZS", companyName: "Zscaler Inc." },
      { symbol: "OKTA", companyName: "Okta Inc." },
      { symbol: "CRWD", companyName: "CrowdStrike Holdings" },
      { symbol: "S", companyName: "SentinelOne Inc." },
    ],
  },
];

// ─── Helper utilities ──────────────────────────────────────────────────────────

export const getSectorById = (sectorId) =>
  STOCK_SECTORS.find((sector) => sector.id === sectorId);

export const getStockBySectorAndSymbol = (sectorId, symbol) => {
  const sector = getSectorById(sectorId);
  if (!sector) return null;
  return sector.stocks.find((stock) => stock.symbol === symbol.toUpperCase()) || null;
};

/** Returns a flat deduplicated list of all symbols across all sectors */
export const getAllSymbols = () => {
  const seen = new Set();
  const result = [];
  STOCK_SECTORS.forEach(sector => {
    sector.stocks.forEach(stock => {
      if (!seen.has(stock.symbol)) {
        seen.add(stock.symbol);
        result.push(stock);
      }
    });
  });
  return result;
};
