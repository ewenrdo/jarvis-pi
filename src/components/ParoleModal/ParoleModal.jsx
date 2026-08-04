import React from 'react';

export default function ParoleModal({ parole, modalBodyRef, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{parole.intro || 'Évangile du jour'}</h3>
            <span className="ref-tag">{parole.ref}</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" ref={modalBodyRef} dangerouslySetInnerHTML={{ __html: parole.contenu }} style={{ maxHeight: '60vh', overflowY: 'auto' }} />
      </div>
    </div>
  );
}