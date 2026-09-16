import React from 'react';
import { Utensils, Users, Key, Sparkles, ChefHat } from 'lucide-react';
import { getStoredApiKey, CHEF_TITLES } from '../services/gemini';

export const STAYCATION_USERS = [
  'Sushmitha',
  'Pooja',
  'Pratyusha',
  'Anvith',
  'Hari Pavan',
  'Nithin',
  'Nynika'
];

export default function Header({ selectedUser, onSelectUser, onOpenKeyModal }) {
  const hasKey = Boolean(getStoredApiKey());
  const isSushmitha = selectedUser === 'Sushmitha';
  const chefTitle = selectedUser ? CHEF_TITLES[selectedUser] : null;

  return (
    <header className="header">
      <div className="brand-section">
        <div className="brand-icon">
          🏖️
        </div>
        <div>
          <h1 className="brand-title">
            Staycation Feast Hub
            <span className="badge-people">
              <Users size={14} /> 6 People Multiplier
            </span>
          </h1>
          {chefTitle && (
            <div style={{ fontSize: '0.8rem', color: isSushmitha ? '#ff9d76' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
              <ChefHat size={13} /> Active Chef: <strong>{selectedUser}</strong> — <em>{chefTitle}</em>
            </div>
          )}
        </div>
      </div>

      <div className="header-controls">
        <div className={`user-selector-wrapper ${isSushmitha ? 'is-sushmitha' : ''}`}>
          <span className="user-label">Select Chef:</span>
          <select
            className="user-select"
            value={selectedUser}
            onChange={(e) => onSelectUser(e.target.value)}
          >
            <option value="">-- Select Your Name --</option>
            {STAYCATION_USERS.map((user) => (
              <option key={user} value={user}>
                {user === 'Sushmitha' ? 'Sushmitha 🍕🔥' : user}
              </option>
            ))}
          </select>
        </div>

        <button className="api-key-btn" onClick={onOpenKeyModal} title="Configure Gemini API Key">
          <Key size={16} />
          <span className={`key-dot ${hasKey ? 'active' : 'inactive'}`} />
          <span>{hasKey ? 'Gemini AI Ready' : 'Set Gemini Key'}</span>
        </button>
      </div>
    </header>
  );
}
