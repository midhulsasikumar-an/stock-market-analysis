import React, { useMemo } from 'react';

const holdings = [
  { stock: 'Reliance', ticker: 'RELI', qty: 10, avgPrice: 2400, currentPrice: 2550, sector: 'Energy' },
  { stock: 'Infosys', ticker: 'INFY', qty: 15, avgPrice: 1700, currentPrice: 1880, sector: 'IT' },
  { stock: 'HDFC Bank', ticker: 'HDFCB', qty: 20, avgPrice: 1100, currentPrice: 1050, sector: 'Finance' },
  { stock: 'TCS', ticker: 'TCS', qty: 8, avgPrice: 3200, currentPrice: 3500, sector: 'IT' },
];

const transactions = [
  { date: '12 Apr', type: 'Buy', stock: 'TCS', quantity: 5, price: 3400 },
  { date: '05 Apr', type: 'Sell', stock: 'INFY', quantity: 10, price: 1850 },
];

const dividends = [
  { date: '15 Mar', stock: 'HDFC Bank', amount: 500 },
  { date: '28 Feb', stock: 'Reliance', amount: 300 },
];

const formatMoney = (value) => `Rs ${Math.round(value).toLocaleString('en-IN')}`;
const formatSigned = (value) => `${value >= 0 ? '+' : '-'}${formatMoney(Math.abs(value))}`;

export default function Portfolio() {
  const computed = useMemo(() => {
    const rows = holdings.map((h) => {
      const invested = h.qty * h.avgPrice;
      const current = h.qty * h.currentPrice;
      const pl = current - invested;
      const returnPct = invested > 0 ? (pl / invested) * 100 : 0;
      return { ...h, invested, current, pl, returnPct };
    });

    const totalInvested = rows.reduce((sum, r) => sum + r.invested, 0);
    const currentValue = rows.reduce((sum, r) => sum + r.current, 0);
    const totalPL = currentValue - totalInvested;
    const totalReturnPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;
    const todaysChange = -420;
    const todaysChangePct = currentValue > 0 ? (todaysChange / currentValue) * 100 : 0;

    return {
      rows,
      totalInvested,
      currentValue,
      totalPL,
      totalReturnPct,
      todaysChange,
      todaysChangePct,
    };
  }, []);

  return (
    <div className="portfolio-page">
      <h1 className="portfolio-title">Stock Portfolio</h1>

      <section className="portfolio-kpi-grid">
        <article className="portfolio-kpi-card">
          <p>Total Invested</p>
          <h2>{formatMoney(computed.totalInvested)}</h2>
        </article>
        <article className="portfolio-kpi-card">
          <p>Current Value</p>
          <h2>{formatMoney(computed.currentValue)}</h2>
        </article>
        <article className="portfolio-kpi-card">
          <p>Total Gain / Loss</p>
          <h2 className={computed.totalPL >= 0 ? 'pos' : 'neg'}>
            {formatSigned(computed.totalPL)} ({computed.totalReturnPct.toFixed(2)}%)
          </h2>
        </article>
        <article className="portfolio-kpi-card">
          <p>Today's Change</p>
          <h2 className={computed.todaysChange >= 0 ? 'pos' : 'neg'}>
            {formatSigned(computed.todaysChange)} ({computed.todaysChangePct.toFixed(2)}%)
          </h2>
        </article>
      </section>

      <section className="portfolio-panel">
        <h3>Holdings</h3>
        <div className="portfolio-table-wrap">
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Ticker</th>
                <th>Qty</th>
                <th>Avg Price</th>
                <th>Current Price</th>
                <th>Invested Amt</th>
                <th>Current Value</th>
                <th>P/L</th>
                <th>% Return</th>
              </tr>
            </thead>
            <tbody>
              {computed.rows.map((row) => (
                <tr key={row.ticker}>
                  <td>{row.stock}</td>
                  <td>{row.ticker}</td>
                  <td>{row.qty}</td>
                  <td>{formatMoney(row.avgPrice)}</td>
                  <td>{formatMoney(row.currentPrice)}</td>
                  <td>{formatMoney(row.invested)}</td>
                  <td>{formatMoney(row.current)}</td>
                  <td className={row.pl >= 0 ? 'pos' : 'neg'}>{formatSigned(row.pl)}</td>
                  <td className={row.returnPct >= 0 ? 'pos' : 'neg'}>
                    {row.returnPct >= 0 ? '+' : ''}{row.returnPct.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="portfolio-grid-2">
        <article className="portfolio-panel">
          <h3>Portfolio Allocation</h3>
          <div className="portfolio-allocation">
            <div className="donut-ring">
              <div className="donut-hole">100%</div>
            </div>
            <ul>
              <li><span className="swatch it"></span> IT 40%</li>
              <li><span className="swatch finance"></span> Finance 30%</li>
              <li><span className="swatch energy"></span> Energy 20%</li>
              <li><span className="swatch others"></span> Others 10%</li>
            </ul>
          </div>
        </article>

        <article className="portfolio-panel">
          <h3>Portfolio Performance</h3>
          <svg viewBox="0 0 600 220" className="portfolio-line-chart" role="img" aria-label="Portfolio performance">
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4"
              points="20,170 75,150 130,155 185,132 240,120 295,125 350,98 405,75 460,82 515,78 575,70"
            />
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="4"
              points="20,182 75,165 130,160 185,170 240,148 295,138 350,142 405,118 460,112 515,104 575,88"
            />
          </svg>
          <div className="portfolio-legend">
            <span><i className="line-blue"></i> My Portfolio</span>
            <span><i className="line-orange"></i> Nifty 50</span>
          </div>
        </article>
      </section>

      <section className="portfolio-grid-2">
        <article className="portfolio-panel">
          <h3>Recent Transactions</h3>
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Stock</th>
                <th>Quantity</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr key={`${tx.stock}-${idx}`}>
                  <td>{tx.date}</td>
                  <td>
                    <span className={`portfolio-pill ${tx.type === 'Buy' ? 'buy' : 'sell'}`}>{tx.type}</span>
                  </td>
                  <td>{tx.stock}</td>
                  <td>{tx.quantity}</td>
                  <td>{formatMoney(tx.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="portfolio-panel">
          <h3>Dividends</h3>
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Stock</th>
                <th>Dividend</th>
              </tr>
            </thead>
            <tbody>
              {dividends.map((dv, idx) => (
                <tr key={`${dv.stock}-${idx}`}>
                  <td>{dv.date}</td>
                  <td>{dv.stock}</td>
                  <td>{formatMoney(dv.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </div>
  );
}
