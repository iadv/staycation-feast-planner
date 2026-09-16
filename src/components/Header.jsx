import React from 'react';
import { Users, ChefHat, Cloud, Check, RefreshCw, HardDrive } from 'lucide-react';
import { CHEF_TITLES } from '../services/gemini';

export const STAYCATION_USERS = [
  'Sushmitha',
  'Pooja',
  'Pratyusha',
  'Anvith',
  'Hari Pavan',
  'Nithin',
  'Nynika'
];

export default function Header({ selectedUser, onSelectUser, syncStatus = 'local' }) {
  const isSushmitha = selectedUser === 'Sushmitha';
  const chefTitle = selectedUser ? CHEF_TITLES[selectedUser] : null;

  const renderSyncBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return (
          <span className="sync-badge synced" title="Synced with Vercel Cloud Blob (Shared across Desktop & Mobile)">
            <Cloud size={13} /> <Check size={12} style={{ marginLeft: '-0.2rem' }} /> Cloud Synced
          </span>
        );
      case 'saving':
        return (
          <span className="sync-badge saving" title="Saving changes to Vercel Cloud Blob...">
            <RefreshCw size={13} className="spin-icon" /> Saving...
          </span>
        );
      case 'syncing':
        return (
          <span className="sync-badge syncing" title="Checking Vercel Cloud Blob storage...">
            <Cloud size={13} /> Connecting...
          </span>
        );
      case 'local':
      default:
        return (
          <span className="sync-badge local" title="Running in Local Storage mode. Set BLOB_READ_WRITE_TOKEN on Vercel for cross-device sync.">
            <HardDrive size={13} /> Local Mode
          </span>
        );
    }
  };

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
            {renderSyncBadge()}
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
                {user}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
