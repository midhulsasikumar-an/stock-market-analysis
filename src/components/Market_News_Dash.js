import React from 'react'

export default function Market_News_Dash() {
  const newsData = [
    {
      title: "IT stocks rally as rupee weakens",
      description:
        "Infosys, TCS and Wipro gained over 2% amid a softer rupee.",
      time: "2h ago",
    },
    {
      title: "Sensex ends flat after volatile session",
      description:
        "Markets remained range-bound as investors awaited global cues.",
      time: "Today",
    },
    {
      title: "Banking stocks under pressure",
      description:
        "Private banks saw mild selling due to profit booking.",
      time: "Yesterday",
    },
  ];

  return (
    <section className="container my-5 text-white">
      <h2 className="fw-bold mb-4">Market News 📰</h2>

      <div className="row g-4">
        {newsData.map((news, index) => (
          <div className="col-md-4" key={index}>
            <div className="card bg-dark news-card p-3 h-100">
              <h5 className="fw-semibold text-light opacity-75 mb-1">{news.title}</h5>
              <p className="text-light opacity-75 small mt-2">
                {news.description}
              </p>
              <span className="text-secondary small">{news.time}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
