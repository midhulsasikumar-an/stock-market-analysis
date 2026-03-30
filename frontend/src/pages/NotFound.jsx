import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3"
      style={{ background: 'var(--bg-dark, #0b1220)' }}
    >
      <div className="text-center" style={{ maxWidth: '520px' }}>
        <div
          className="fw-bold mb-2"
          style={{
            fontSize: 'clamp(4rem, 18vw, 7rem)',
            lineHeight: 1,
            color: 'rgba(148,163,184,0.22)',
            letterSpacing: '-0.06em',
          }}
        >
          404
        </div>
        <h1 className="fw-bold text-white mb-3" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)' }}>
          Page not found
        </h1>
        <p className="text-muted mb-4" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
          <Link
            to="/dashboard"
            className="btn btn-primary px-4 py-2 fw-semibold"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="btn btn-outline-secondary px-4 py-2 fw-semibold"
            style={{ borderColor: 'rgba(255,255,255,0.12)' }}
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}