export const STOCK_SECTORS = [
  {
    id: "electronics",
    name: "Electronics",
    performance: 2.6,
    totalMarketCap: 3200000000000,
    stocks: [
      { symbol: "AAPL", companyName: "Apple Inc.", price: 191.24, change: 1.15, volume: 54211800, marketCap: 2980000000000, peRatio: 30.4, eps: 6.29, high52: 199.62, low52: 163.41 },
      { symbol: "SONY", companyName: "Sony Group Corp.", price: 95.72, change: -0.42, volume: 4125300, marketCap: 116000000000, peRatio: 16.2, eps: 5.91, high52: 104.09, low52: 81.56 },
      { symbol: "HPQ", companyName: "HP Inc.", price: 31.18, change: 0.74, volume: 9642200, marketCap: 30100000000, peRatio: 10.6, eps: 2.94, high52: 39.52, low52: 27.43 }
    ]
  },
  {
    id: "information-technology",
    name: "Information Technology",
    performance: 3.9,
    totalMarketCap: 11200000000000,
    stocks: [
      { symbol: "MSFT", companyName: "Microsoft Corp.", price: 427.88, change: 1.92, volume: 28104500, marketCap: 3180000000000, peRatio: 36.1, eps: 11.85, high52: 432.20, low52: 309.45 },
      { symbol: "NVDA", companyName: "NVIDIA Corp.", price: 122.46, change: 2.84, volume: 112322000, marketCap: 3010000000000, peRatio: 66.3, eps: 1.85, high52: 140.76, low52: 75.61 },
      { symbol: "ORCL", companyName: "Oracle Corp.", price: 138.55, change: -0.63, volume: 7211700, marketCap: 383000000000, peRatio: 33.8, eps: 4.10, high52: 145.18, low52: 101.85 }
    ]
  },
  {
    id: "banking-finance",
    name: "Banking & Finance",
    performance: 1.1,
    totalMarketCap: 5400000000000,
    stocks: [
      { symbol: "JPM", companyName: "JPMorgan Chase & Co.", price: 210.03, change: 0.48, volume: 10211400, marketCap: 607000000000, peRatio: 12.9, eps: 16.28, high52: 214.52, low52: 145.36 },
      { symbol: "BAC", companyName: "Bank of America Corp.", price: 41.77, change: -0.22, volume: 33600900, marketCap: 326000000000, peRatio: 14.8, eps: 2.82, high52: 44.44, low52: 31.35 },
      { symbol: "GS", companyName: "Goldman Sachs Group Inc.", price: 482.65, change: 0.95, volume: 2394200, marketCap: 152000000000, peRatio: 16.1, eps: 29.98, high52: 491.17, low52: 300.61 }
    ]
  },
  {
    id: "healthcare",
    name: "Healthcare",
    performance: -0.8,
    totalMarketCap: 4700000000000,
    stocks: [
      { symbol: "JNJ", companyName: "Johnson & Johnson", price: 154.72, change: -0.57, volume: 7212500, marketCap: 372000000000, peRatio: 16.5, eps: 9.38, high52: 168.85, low52: 143.13 },
      { symbol: "PFE", companyName: "Pfizer Inc.", price: 28.91, change: -1.26, volume: 34990100, marketCap: 163000000000, peRatio: 13.4, eps: 2.16, high52: 34.66, low52: 24.48 },
      { symbol: "UNH", companyName: "UnitedHealth Group Inc.", price: 498.34, change: 0.36, volume: 2864400, marketCap: 458000000000, peRatio: 21.7, eps: 22.96, high52: 554.70, low52: 436.38 }
    ]
  },
  {
    id: "automobile",
    name: "Automobile",
    performance: 0.6,
    totalMarketCap: 1900000000000,
    stocks: [
      { symbol: "TSLA", companyName: "Tesla Inc.", price: 248.51, change: 1.84, volume: 92831100, marketCap: 792000000000, peRatio: 66.8, eps: 3.72, high52: 299.29, low52: 152.37 },
      { symbol: "F", companyName: "Ford Motor Co.", price: 12.14, change: -0.41, volume: 49458000, marketCap: 48200000000, peRatio: 7.9, eps: 1.54, high52: 14.98, low52: 9.63 },
      { symbol: "GM", companyName: "General Motors Co.", price: 44.91, change: 0.63, volume: 14122300, marketCap: 51700000000, peRatio: 6.1, eps: 7.37, high52: 50.50, low52: 26.30 }
    ]
  },
  {
    id: "energy",
    name: "Energy",
    performance: -1.5,
    totalMarketCap: 3600000000000,
    stocks: [
      { symbol: "XOM", companyName: "Exxon Mobil Corp.", price: 104.61, change: -0.84, volume: 21330400, marketCap: 434000000000, peRatio: 13.1, eps: 7.98, high52: 123.75, low52: 95.33 },
      { symbol: "CVX", companyName: "Chevron Corp.", price: 150.23, change: -1.08, volume: 9518400, marketCap: 275000000000, peRatio: 14.9, eps: 10.07, high52: 170.17, low52: 138.60 },
      { symbol: "SLB", companyName: "Schlumberger NV", price: 48.76, change: 0.22, volume: 10200900, marketCap: 69600000000, peRatio: 16.4, eps: 2.98, high52: 53.37, low52: 41.16 }
    ]
  },
  {
    id: "consumer-goods",
    name: "Consumer Goods",
    performance: 1.9,
    totalMarketCap: 4200000000000,
    stocks: [
      { symbol: "PG", companyName: "Procter & Gamble Co.", price: 169.85, change: 0.55, volume: 6340900, marketCap: 400000000000, peRatio: 27.2, eps: 6.24, high52: 173.18, low52: 141.45 },
      { symbol: "KO", companyName: "Coca-Cola Co.", price: 62.31, change: 0.14, volume: 11209300, marketCap: 268000000000, peRatio: 24.5, eps: 2.54, high52: 64.98, low52: 53.72 },
      { symbol: "PEP", companyName: "PepsiCo Inc.", price: 173.11, change: -0.31, volume: 4742100, marketCap: 238000000000, peRatio: 25.0, eps: 6.92, high52: 183.41, low52: 157.43 }
    ]
  },
  {
    id: "telecommunications",
    name: "Telecommunications",
    performance: 0.3,
    totalMarketCap: 1700000000000,
    stocks: [
      { symbol: "VZ", companyName: "Verizon Communications Inc.", price: 40.82, change: 0.28, volume: 18251200, marketCap: 172000000000, peRatio: 10.4, eps: 3.92, high52: 45.36, low52: 32.01 },
      { symbol: "T", companyName: "AT&T Inc.", price: 18.27, change: -0.22, volume: 30101900, marketCap: 131000000000, peRatio: 9.6, eps: 1.90, high52: 19.66, low52: 14.12 },
      { symbol: "TMUS", companyName: "T-Mobile US Inc.", price: 175.93, change: 1.01, volume: 5040200, marketCap: 204000000000, peRatio: 25.8, eps: 6.82, high52: 180.10, low52: 137.69 }
    ]
  }
];

export const getSectorById = (sectorId) =>
  STOCK_SECTORS.find((sector) => sector.id === sectorId);

export const getStockBySectorAndSymbol = (sectorId, symbol) => {
  const sector = getSectorById(sectorId);
  if (!sector) return null;
  return sector.stocks.find((stock) => stock.symbol === symbol.toUpperCase()) || null;
};
