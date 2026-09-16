import React from 'react';
import { Utensils, Users, Key, Flame, ShieldAlert } from 'lucide-react';
import { getStoredApiKey } from '../services/gemini';

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
        </div>
      </div>

      <div className="header-controls">
        <div className={`user-selector-wrapper ${isSushmitha ? 'is-sushmitha' : ''}`}>
          <span className="user-label">Who is adding?</span>
          <select
            className="user-select"
            value={selectedUser}
            onChange={(e) => onSelectUser(e.target.value)}
          >
            {STAYCATION_USERS.map((user) => (
              <option key={user} value={user}>
                {user === 'Sushmitha' ? 'Sushmitha 🌶️' : user}
              </option>
            ))}
          </select>

          {isSushmitha && (
            <span className="sushmitha-alert-tag" title="Sushmitha Roast Persona Active!">
              <Flame size={13} /> Roast Mode Active
            </span>
          )}
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
