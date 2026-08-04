import React from 'react';

export default function OfflinePlaceholder({ label }) {
  return (
    <div className="offline-placeholder">
      <span>📡</span>
      <p>{label}</p>
    </div>
  );
}