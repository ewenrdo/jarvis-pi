import React from 'react';

export default function AppsMenuModal({ apps, selectedAppIndex, onClose }) {
  return (
    <div className="modal-backdrop dark-overlay" onClick={onClose}>
      <div className="pure-apps-container" onClick={(e) => e.stopPropagation()}>
        <div className="pure-apps-grid">
          {apps.map((app, idx) => (
            <div
              key={app.id}
              className={`pure-app-item ${idx === selectedAppIndex ? 'focused' : ''}`}
              onClick={onClose}
            >
              <img src={app.iconUrl} alt={app.name} className="pure-app-img" />
              <span className="pure-app-label">{app.name}</span>
            </div>
          ))}
        </div>
        <div className="pure-apps-hint">
          [Flèches] Naviguer | [Entrée] Ouvrir | [Échap] Fermer
        </div>
      </div>
    </div>
  );
}