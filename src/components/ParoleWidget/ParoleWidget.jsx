import React, { useEffect, useState } from 'react';
import PdaCard from '../PdaCard/PdaCard';

export default function ParoleWidget({ focused, isOnline, onOpen, onParoleLoaded }) {
  const [parole, setParole] = useState(null);

  useEffect(() => {
    let isSubscribed = true;

    const fetchParole = async () => {
      if (!isOnline) {
        if (isSubscribed) {
          setParole(null);
          onParoleLoaded?.(null);
        }
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`https://api.aelf.org/v1/messes/${today}/france`);
        if (!response.ok) throw new Error('Erreur AELF');

        const data = await response.json();
        const evangiles = data?.messes?.[0]?.lectures?.filter((lecture) => lecture.type === 'evangile') || [];
        
        if (evangiles.length > 0 && isSubscribed) {
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
        // Le widget conserve son état ou gère l'absence de données sans bloquer l'interface
      }
    };

    fetchParole();

    return () => {
      isSubscribed = false;
    };
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