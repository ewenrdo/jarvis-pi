import React, { useEffect, useState, useCallback } from 'react';
import PdaCard from '../PdaCard/PdaCard';
import './TransportWidget.scss';

// Utilitaire pour récupérer l'image de la ligne (/trains/c.webp, /trains/14.webp, etc.)
const getLineIconPath = (line) => {
    if (!line) return null;
    const cleanLine = String(line).trim().toLowerCase().replace(/^rer\s+/, '');
    return `/trains/${cleanLine}.webp`;
};

export default function TransportWidget({ focused, isOnline, transportContainerRef }) {
    const [journeys, setJourneys] = useState({ primary: null, backup: null });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [now, setNow] = useState(new Date());

    // Fonction de récupération des itinéraires
    const fetchTransportData = useCallback(async () => {
        if (!isOnline) {
            setError('Hors ligne');
            setIsLoading(false);
            return;
        }

        try {
            const jarvis_server_url = import.meta.env.VITE_JARVIS_SERVER_URL;
            const response = await fetch(`${jarvis_server_url}/api/idfm/next-departures-to-faculty`, {
                headers: { accept: 'application/json' }
            });

            if (!response.ok) throw new Error('Erreur réseau IDFM');

            const data = await response.json();
            setJourneys(data);
            setError(null);
        } catch (err) {
            setError(err?.message || 'Erreur de chargement');
        } finally {
            setIsLoading(false);
        }
    }, [isOnline]);

    // 1. Requête API IDFM toutes les 2 minutes
    useEffect(() => {
        fetchTransportData();
        const apiInterval = setInterval(fetchTransportData, 2 * 60 * 1000);
        return () => clearInterval(apiInterval);
    }, [fetchTransportData]);

    // 2. Horloge locale rafraîchie toutes les 15 secondes
    useEffect(() => {
        const timerInterval = setInterval(() => setNow(new Date()), 15 * 1000);
        return () => clearInterval(timerInterval);
    }, []);

    const primary = journeys?.primary;
    const backup = journeys?.backup;

    // Calcul du temps restant en minutes jusqu'au départ de la maison
    const calculateMinutesLeft = () => {
        if (!primary?.homeDepartureIso) return null;
        const depDate = new Date(primary.homeDepartureIso);
        return Math.round((depDate - now) / 60000);
    };

    const minutesLeft = calculateMinutesLeft();

    // 3. Si le départ piéton est dépassé depuis plus de 2 minutes, on re-fetch immédiatement
    useEffect(() => {
        if (minutesLeft !== null && minutesLeft < -2 && !isLoading) {
            fetchTransportData();
        }
    }, [minutesLeft, isLoading, fetchTransportData]);

    // Rendu du texte d'état selon le délai
    const renderDepartureStatus = () => {
        if (minutesLeft === null) return null;

        if (minutesLeft > 0) {
            return (
                <>
                    Partir dans <strong>{minutesLeft} min</strong>
                    <span className="exact-home-time"> ({primary.departureTime})</span>
                </>
            );
        } else if (minutesLeft >= -2) {
            return (
                <>
                    Départ <strong>imminent</strong>
                    <span className="exact-home-time"> ({primary.departureTime})</span>
                </>
            );
        } else {
            return (
                <>
                    Départ <strong>manqué</strong>
                    <span className="exact-home-time"> ({primary.departureTime})</span>
                </>
            );
        }
    };

    // Style de la pastille lumineuse
    const getDotClass = () => {
        if (minutesLeft === null || minutesLeft > 0) return "green-glow-dot";
        if (minutesLeft >= -2) return "orange-glow-dot";
        return "red-glow-dot";
    };

    // Mise en forme des étapes secondaires
    const formatStepsText = (steps) => {
        if (!steps || steps.length === 0) return '';
        return steps.map(s => `${s.mode} ${s.line}`).join(' puis ');
    };

    return (
        <PdaCard focused={focused} title="Prochains trains" icon="🚆" style={{ flex: 1 }}>
            <div className="pda-transport-card-content" ref={transportContainerRef}>
                {isLoading ? (
                    <div className="transport-status">Chargement des itinéraires...</div>
                ) : error ? (
                    <div className="transport-status error">⚠️ {error}</div>
                ) : !primary ? (
                    <div className="transport-status">Aucun itinéraire disponible</div>
                ) : (
                    <div className="transport-body">
                        {/* En-tête : État du départ maison */}
                        <div className="departure-badge">
                            <span className={getDotClass()}></span>
                            <span className="departure-text">
                                {renderDepartureStatus()}
                            </span>
                        </div>

                        {/* Puces des lignes de transport */}
                        <div className="lines-chain">
                            {primary.steps.map((step, idx) => (
                                <React.Fragment key={idx}>
                                    {idx > 0 && <span className="chain-arrow">&gt;</span>}
                                    <img
                                        src={getLineIconPath(step.line)}
                                        alt={step.line}
                                        className="line-badge-icon"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Gare départ (Heure du train) -> Fac (Heure d'arrivée) */}
                        <div className="route-schedule">
                            <span className="station-dep">{primary.steps[0]?.from || 'Gare'}</span>
                            <span className="train-time">{primary.firstTrainDepartureTime || primary.departureTime}</span>
                            <span className="arrow">&rarr;</span>
                            <span className="station-arr">Fac</span>
                            <span className="time">{primary.arrivalTime}</span>
                        </div>

                        {/* Itinéraire de secours */}
                        {backup && (
                            <div className="backup-route">
                                Secours : <strong>{formatStepsText(backup.steps)}</strong>
                                {backup.durationMinutes ? ` (${Math.round(backup.durationMinutes / 4)} min à pied)` : ''}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PdaCard>
    );
}