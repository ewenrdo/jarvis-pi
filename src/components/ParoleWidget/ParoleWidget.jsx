import React, { useEffect, useState } from 'react';
import PdaCard from '../PdaCard/PdaCard';

export default function ParoleWidget({ focused, isOnline, onOpen, onParoleLoaded }) {
  const [parole, setParole] = useState(null);

  useEffect(() => {
    const fetchParole = async () => {
      if (!isOnline) {
        setParole(null);
        onParoleLoaded?.(null);
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`https://api.aelf.org/v1/messes/${today}/france`);
        if (!response.ok) throw new Error('Erreur AELF');

        const data = await response.json();
        const evangiles = data?.messes?.[0]?.lectures?.filter((lecture) => lecture.type === 'evangile') || [];
        if (evangiles.length > 0) {
          const premier = evangiles[0];
          const fullContent = evangiles.map((entry) => entry.contenu).join('<hr class="evangile-separator" />');
          const combinedRefs = [...new Set(evangiles.map((entry) => entry.ref))].join(' / ');
          const nextParole = {
            titre: premier.titre?.replace(/[«»]/g, '').trim(),
            ref: combinedRefs,
            intro: premier.intro_lue,
            contenu: fullContent
          };

          setParole(nextParole);
          onParoleLoaded?.(nextParole);
        }
      } catch {
        // The widget falls back to the loading state until a value is available.
      }
    };

    fetchParole();
  }, [isOnline, onParoleLoaded]);

  return (
    <PdaCard focused={focused} title="Parole du jour" icon="📖" onClick={onOpen} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {!isOnline ? (
          <span style={{ color: '#8b949e', fontSize: '0.85rem' }}>Hors ligne</span>
        ) : parole ? (
          <blockquote className="parole-quote">« {parole.titre} »</blockquote>
        ) : (
          <span style={{ color: '#8b949e', fontSize: '0.85rem' }}>Chargement...</span>
        )}
      </div>
    </PdaCard>
  );
}