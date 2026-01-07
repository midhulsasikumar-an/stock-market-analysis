import React from 'react'

export default function Watchlist() {
  const watchlistData = [
    { name: "TCS", price: "₹3,630", change: "+1.5%", positive: true },
    { name: "INFY", price: "₹1,450", change: "+4.3%", positive: true },
    { name: "WIPRO", price: "₹395", change: "-2.8%", positive: false },
    { name: "RELIANCE", price: "₹2,570", change: "+0.9%", positive: true },
  ];

  return (
    <section className="container my-5">
      <h2 className="text-white fw-bold mb-4">Your Watchlist 👀</h2>

      <div className="row g-4">
        {watchlistData.map((stock, index) => (
          <div className="col-md-3" key={index}>
            <div className="card text-white bg-glass rounded-4 hover-glow border-glass h-100">
              <div className="card-body">
                <h5 className="fw-bold">{stock.name}</h5>
                <p className="text-light opacity-75 mb-1">{stock.price}</p>

                <span
                  className={`fw-semibold ${stock.positive ? "text-success" : "text-danger"
                    }`}
                >
                  {stock.change}
                </span>

                <div className="mt-3 d-flex justify-content-between">
                  <button className="btn btn-glass btn-sm">
                    View
                  </button>
                  <button className="btn btn-outline-danger btn-sm">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
