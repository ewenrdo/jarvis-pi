import React, { useEffect, useState } from 'react';
import PdaCard from '../PdaCard/PdaCard';

const getTransportColor = (lineRefValue) => {
    const line = String(lineRefValue ?? '')
        .trim()
        .toUpperCase()
        .replace(/^RER\s+/, '');

    switch (line) {
        case 'C':
            return { backgroundColor: '#ffcc30', color: '#292828' };

        case 'H':
            return { backgroundColor: '#84653d', color: '#ffffff' };

        case 'J':
            return { backgroundColor: '#cec73d', color: '#292828' };

        default:
            console.warn('Ligne inconnue:', lineRefValue);
            return { backgroundColor: '#8b949e', color: '#ffffff' };
    }
};



export default function TransportWidget({ focused, isOnline, transportContainerRef }) {
    const [nextDepartures, setNextDepartures] = useState([]);
    const [isTransportLoading, setIsTransportLoading] = useState(true);
    const [transportError, setTransportError] = useState(null);

    useEffect(() => {
        const fetchTransportData = async () => {
            if (!isOnline) {
                setTransportError('Hors ligne');
                setIsTransportLoading(false);
                return;
            }

            // Ne force l'état de chargement que lors du premier appel pour éviter les clignotements constants
            try {
                const jarvis_server_url = import.meta.env.VITE_JARVIS_SERVER_URL;
                const response = await fetch(`${jarvis_server_url}/api/idfm/next-departures`, {
                    headers: {
                        accept: 'application/json',
                    }
                });

                if (!response.ok) throw new Error('Erreur de récupération des données IDFM');

                const data = await response.json();
                setNextDepartures(data);
                setTransportError(null);
            } catch (error) {
                setTransportError(error?.message || 'Impossible de charger les départs');
            } finally {
                setIsTransportLoading(false);
            }
        };

        fetchTransportData();

        // Rafraîchissement automatique toutes les 2 minutes pour actualiser les horaires en continu
        const transportInterval = setInterval(fetchTransportData, 15 * 60 * 1000);

        return () => clearInterval(transportInterval);
    }, [isOnline]);

    return (
        <PdaCard focused={focused} title="Prochain départ RER C" icon="🚆" style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div className="transport-scroll-area" style={{ maxHeight: '210px', overflowY: 'hidden' }} ref={transportContainerRef}>
                    {isTransportLoading ? (
                        <div style={{ fontSize: '0.8rem', color: '#8b949e', textAlign: 'center', padding: '10px' }}>Chargement des départs...</div>
                    ) : transportError ? (
                        <div style={{ fontSize: '0.8rem', color: '#ff7b72', textAlign: 'center', padding: '15px 10px' }}>⚠️ {transportError}</div>
                    ) : nextDepartures.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: '#8b949e', textAlign: 'center', padding: '15px 10px' }}>Aucun départ disponible.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                            {nextDepartures.slice(0, 10).map((item) => (

                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div>
                                        <span style={{ color: '#58a6ff', fontWeight: 600, fontSize: '0.9rem' }}>
                                            <span style={{ ...getTransportColor(item.shortLine), padding: '2px 6px', borderRadius: '4px', fontWeight: 600, marginRight: '6px' }}>
                                                {item.journeyNote}
                                            </span> {item.expectedTime || item.aimedTime}
                                        </span>
                                        {item.delay > 0 && (
                                            <span style={{ color: '#ff7b72', fontSize: '0.75rem', marginLeft: '6px' }}>(+{item.delay}m)</span>
                                        )}
                                        <div style={{ fontSize: '0.8rem', color: '#c9d1d9', marginTop: '2px', fontWeight: 500 }}>

                                            {item.destination}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>
                                        {item.status === 'delayed' ? 'Retardé' : 'À l\'heure'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </PdaCard>
    );
}