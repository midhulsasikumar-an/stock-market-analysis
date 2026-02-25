import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Intro() {
  const navigate = useNavigate()
  return (
    <main className="hero py-5 min-vh-100 d-flex align-items-center">
      <div className="container text-center position-relative z-3">
        
        <h1 className="text-white fw-bold display-3">
          Think ahead. Invest ahead.
        </h1>
        <p className="text-white lead mb-4">
          Predict trends, plan your moves, and invest with confidence.
        </p>

        <div className="hero-cta">
          <button
            type="button"
            className="btn btn-primary btn-lg hero-get-started-btn"
            onClick={() => navigate('/register')}
          >
            Get Started
          </button>
          <a className="btn btn-outline-light btn-lg hero-learn-more-btn" href="#">
            Learn More
          </a>
        </div>
      </div>
      
    </main>
  )
}
