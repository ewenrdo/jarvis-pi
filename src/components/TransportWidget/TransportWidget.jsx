import React, { useEffect, useState } from 'react';
import PdaCard from '../PdaCard/PdaCard';

const getTransportIcon = (lineRefValue) => {
    if (lineRefValue.includes('::C')) return '🚆';
    if (lineRefValue.includes('::B')) return '🚇';
    if (lineRefValue.includes('::T')) return '🚋';
    return '🚌';
};

export default function TransportWidget({ focused, isOnline }) {
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
            } catch {
                setTransportError('Impossible de charger les départs');
            } finally {
                setIsTransportLoading(false);
            }
        };

        fetchTransportData();

        // Rafraîchissement automatique toutes les 2 minutes pour actualiser les horaires en continu
        const transportInterval = setInterval(fetchTransportData, 2 * 60 * 1000);

        return () => clearInterval(transportInterval);
    }, [isOnline]);

    return (
        <PdaCard focused={focused} title="Prochain départ RER C" icon="🚆" style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div className="transport-scroll-area" style={{ maxHeight: '210px', overflowY: 'auto' }}>
                    {isTransportLoading ? (
                        <div style={{ fontSize: '0.8rem', color: '#8b949e', textAlign: 'center', padding: '10px' }}>Chargement des départs...</div>
                    ) : transportError ? (
                        <div style={{ fontSize: '0.8rem', color: '#ff7b72', textAlign: 'center', padding: '15px 10px' }}>⚠️ {transportError}</div>
                    ) : nextDepartures.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: '#8b949e', textAlign: 'center', padding: '15px 10px' }}>Aucun départ disponible.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {nextDepartures.map((item) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div>
                                        <span style={{ color: '#58a6ff', fontWeight: 600, fontSize: '0.9rem' }}>
                                            {item.modeIcon} {item.expectedTime || item.aimedTime}
                                        </span>
                                        {item.delay > 0 && (
                                            <span style={{ color: '#ff7b72', fontSize: '0.75rem', marginLeft: '6px' }}>(+{item.delay}m)</span>
                                        )}
                                        <div style={{ fontSize: '0.8rem', color: '#c9d1d9', marginTop: '2px', fontWeight: 500 }}>
                                            ➔ {item.destination}
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