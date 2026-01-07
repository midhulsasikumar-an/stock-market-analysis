import React from 'react'

export default function Recently_Searched_Dash() {
  const recentStocks = [
    "ADANI PORTS",
    "TATA MOTORS",
    "PAYTM",
    "ZOMATO",
    "HDFCBANK",
  ];

  return (
    <section className="container my-5">
      <h2 className="text-white fw-bold mb-4">Recently Searched 🔍</h2>

      <div className="d-flex flex-wrap gap-3">
        {recentStocks.map((stock, index) => (
          <div
            key={index}
            className="recent-chip px-4 py-2 rounded-pill text-white fw-semibold"
          >
            {stock}
          </div>
        ))}
      </div>
    </section>
  )
}
