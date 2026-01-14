import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Recently_Searched_Dash() {
  const navigate = useNavigate();
  const recentStocks = [
    { name: "RELIANCE", sym: "RELIANCE.NS" },
    { name: "TATA MOTORS", sym: "TATAMOTORS.NS" },
    { name: "APPLE", sym: "AAPL" },
    { name: "TESLA", sym: "TSLA" },
    { name: "HDFC BANK", sym: "HDFCBANK.NS" },
  ];

  return (
    <section className="container my-5">
      <h2 className="text-white fw-bold mb-4">Recently Searched 🔍</h2>

      <div className="d-flex flex-wrap gap-3">
        {recentStocks.map((stock, index) => (
          <div
            key={index}
            className="recent-chip px-4 py-2 rounded-pill text-white fw-semibold cursor-pointer shadow-sm hover-glow"
            style={{ cursor: 'pointer', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
            onClick={() => navigate(`/stock/${stock.sym}`)}
          >
            {stock.name}
          </div>
        ))}
      </div>
    </section>
  )
}
