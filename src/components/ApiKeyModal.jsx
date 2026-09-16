import React, { useState } from 'react';
import { Key, X, Check, ExternalLink } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../services/gemini';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredApiKey(apiKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Key style={{ color: 'var(--primary)' }} size={20} />
            <h3 className="modal-title">Gemini API Key Settings</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Your Gemini API key will be stored securely in your browser's local storage (or read automatically from your <code>.env</code> file: <code>VITE_GEMINI_API_KEY</code>).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Gemini API Key
          </label>
          <input
            type="password"
            className="modal-input"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button
            className="action-icon-btn"
            onClick={onClose}
            style={{ padding: '0.5rem 1rem' }}
          >
            Cancel
          </button>
          <button
            className="send-btn"
            onClick={handleSave}
            style={{ padding: '0.5rem 1.2rem' }}
          >
            {saved ? <Check size={16} /> : null}
            <span>{saved ? 'Saved!' : 'Save Key'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
