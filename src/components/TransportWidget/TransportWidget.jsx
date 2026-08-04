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

      setIsTransportLoading(true);
      setTransportError(null);

      try {
        const apiKey = import.meta.env.VITE_IDFM_API_KEY;
        if (!apiKey) throw new Error('Clé IDFM manquante');

        const ermontStopId = 'STIF%3AStopPoint%3AQ%3A41085%3A';
        const ermontCLineId = 'STIF%3ALine%3AC01727%3A1%3A';
        const response = await fetch(`https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=${ermontStopId}&LineRef=${ermontCLineId}`, {
          headers: {
            accept: 'application/json',
            apikey: apiKey
          }
        });

        if (!response.ok) throw new Error('Erreur de récupération des départs');
        const data = await response.json();
        const stopVisits = data?.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0]?.MonitoredStopVisit || [];

        const departures = stopVisits.map((visit) => {
          const journey = visit.MonitoredVehicleJourney;
          const call = journey.MonitoredCall;
          const aimedDeparture = new Date(call.AimedDepartureTime);
          const expectedDeparture = call.ExpectedDepartureTime ? new Date(call.ExpectedDepartureTime) : null;

          let delayMinutes = 0;
          if (expectedDeparture && call.DepartureStatus === 'delayed') {
            delayMinutes = Math.round((expectedDeparture - aimedDeparture) / 60000);
          }

          return {
            id: visit.ItemIdentifier,
            line: journey.LineRef?.value || '',
            modeIcon: getTransportIcon(journey.LineRef?.value || ''),
            destination: call.DestinationDisplay?.[0]?.value || journey.DestinationName?.[0]?.value || 'Inconnue',
            aimedTime: aimedDeparture.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            expectedTime: expectedDeparture ? expectedDeparture.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
            status: call.DepartureStatus,
            delay: delayMinutes
          };
        });

        setNextDepartures(departures);
      } catch {
        setTransportError('Impossible de charger les départs');
        setNextDepartures([]);
      } finally {
        setIsTransportLoading(false);
      }
    };

    fetchTransportData();
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