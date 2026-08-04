import React from 'react';
import './BodyMap.module.scss';

export default function BodyMap({ workedMuscles = [] }) {
  // Verifie si un muscle a été travaillé récemment
  const isWorked = (muscleName) => workedMuscles.includes(muscleName);

  return (
    <div className="body-map-container">
      {/* Face Avant */}
      <div className="body-view">
        <span className="view-label">AVANT</span>
        <svg viewBox="0 0 100 200" className="body-svg">
          {/* Tête (Déco) */}
          <circle cx="50" cy="20" r="12" fill="#2a3241" />
          
          {/* Pectoraux */}
          <path
            d="M 36 48 Q 50 52 50 64 Q 35 64 34 52 Z M 64 48 Q 50 52 50 64 Q 65 64 66 52 Z"
            className={`muscle ${isWorked('chest') ? 'active' : ''}`}
          />
          
          {/* Épaules (Deltoïdes avant) */}
          <path
            d="M 26 46 Q 34 46 34 56 Q 25 58 26 46 Z M 74 46 Q 66 46 66 56 Q 75 58 74 46 Z"
            className={`muscle ${isWorked('shoulders') ? 'active' : ''}`}
          />

          {/* Biceps */}
          <path
            d="M 23 58 Q 32 58 30 74 Q 22 72 23 58 Z M 77 58 Q 68 58 70 74 Q 78 72 77 58 Z"
            className={`muscle ${isWorked('biceps') ? 'active' : ''}`}
          />

          {/* Abdominaux */}
          <rect
            x="42" y="66" width="16" height="30" rx="3"
            className={`muscle ${isWorked('abs') ? 'active' : ''}`}
          />

          {/* Quadriceps (Jambes avant) */}
          <path
            d="M 34 102 Q 48 102 46 145 Q 35 145 34 102 Z M 66 102 Q 52 102 54 145 Q 65 145 66 102 Z"
            className={`muscle ${isWorked('quads') ? 'active' : ''}`}
          />
        </svg>
      </div>

      {/* Face Arrière */}
      <div className="body-view">
        <span className="view-label">ARRIÈRE</span>
        <svg viewBox="0 0 100 200" className="body-svg">
          {/* Tête */}
          <circle cx="50" cy="20" r="12" fill="#2a3241" />

          {/* Trapezes / Haut du dos */}
          <polygon
            points="50,36 34,48 66,48"
            className={`muscle ${isWorked('traps') ? 'active' : ''}`}
          />

          {/* Grand Dorsal */}
          <path
            d="M 34 50 Q 50 55 50 78 Q 37 78 34 50 Z M 66 50 Q 50 55 50 78 Q 63 78 66 50 Z"
            className={`muscle ${isWorked('lats') ? 'active' : ''}`}
          />

          {/* Triceps */}
          <path
            d="M 22 58 Q 31 58 30 74 Q 21 72 22 58 Z M 78 58 Q 69 58 70 74 Q 79 72 78 58 Z"
            className={`muscle ${isWorked('triceps') ? 'active' : ''}`}
          />

          {/* Fessiers */}
          <path
            d="M 33 100 Q 50 96 50 118 Q 33 118 33 100 Z M 67 100 Q 50 96 50 118 Q 67 118 67 100 Z"
            className={`muscle ${isWorked('glutes') ? 'active' : ''}`}
          />

          {/* Ischio-jambiers / Mollets */}
          <path
            d="M 34 122 Q 48 122 46 165 Q 35 165 34 122 Z M 66 122 Q 52 122 54 165 Q 65 165 66 122 Z"
            className={`muscle ${isWorked('hamstrings') ? 'active' : ''}`}
          />
        </svg>
      </div>
    </div>
  );
}