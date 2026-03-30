import React from 'react';
import '../styles/App.css';
import { useAuth } from '../context/AuthContext';

export default function Hero_Dash() {
  const { user } = useAuth();
  const displayName = user?.firstName
    ? user.firstName
    : (user?.username || user?.email?.split('@')[0] || 'BACK');
  const friendlyName = displayName === 'BACK'
    ? 'there'
    : displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();

  return (
    <div className="hero-redesign">
      <h1 className="hero-title-redesign">Welcome back, {friendlyName} 👋</h1>
      <p className="hero-subtitle-redesign">Real-time market intelligence and portfolio insights.</p>
    </div>
  );
}
