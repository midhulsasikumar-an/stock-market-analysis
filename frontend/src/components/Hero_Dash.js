import React from 'react';
import '../styles/DashboardRedesign.css';
import { useAuth } from '../context/AuthContext';

export default function Hero_Dash() {
  const { user } = useAuth();
  const displayName = user?.firstName
    ? user.firstName
    : (user?.username || user?.email?.split('@')[0] || 'BACK');

  return (
    <div className="hero-redesign">
      <h1 className="hero-title-redesign">WELCOME, {displayName.toUpperCase()} 👋</h1>
      <p className="hero-subtitle-redesign">Real-time market intelligence and portfolio insights.</p>
    </div>
  );
}
