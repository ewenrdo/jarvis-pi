import React, { useEffect, useState } from 'react';
import PdaCard from '../PdaCard/PdaCard';

export default function RenaultCarWidget({ focused, isOnline }) {
    const [dataCar, setDataCar] = useState({});
    const [isRenaultCarLoading, setIsRenaultCarLoading] = useState(true);
    const [renaultCarError, setRenaultCarError] = useState(null);

    useEffect(() => {
        const fetchRenaultCarData = async () => {
            if (!isOnline) {
                setRenaultCarError('Hors ligne');
                setIsRenaultCarLoading(false);
                return;
            }

            setIsRenaultCarLoading(true);
            setRenaultCarError(null);

            try {
                const jarvis_server_url = import.meta.env.VITE_JARVIS_SERVER_URL;
                const response = await fetch(`${jarvis_server_url}/api/renault/stats`, {
                    headers: {
                        accept: 'application/json',
                    }
                });

                if (!response.ok) throw new Error('Erreur de récupération des données Renault Car');
                const data = await response.json();
                setDataCar(data);
            } catch {
                setRenaultCarError('Impossible de charger les données Renault Car');
            } finally {
                setIsRenaultCarLoading(false);
            }
        };

        fetchRenaultCarData();
        const intervalId = setInterval(fetchRenaultCarData, 2 * 60 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [isOnline]);

    const fuelPercentage = Number(dataCar.fuel_percentage) || 0;
    const isUnder50 = fuelPercentage < 50;

    return (
        <PdaCard focused={focused} title="Votre véhicule" icon="🚗" className="renault-car-card">
            <div className="renault-car-content">
                {isRenaultCarLoading ? (
                    <div className="renault-car-state">Chargement...</div>
                ) : renaultCarError ? (
                    <div className="renault-car-state renault-car-state-error">⚠️ {renaultCarError}</div>
                ) : (
                    <div className="renault-car-body">
                        <div className="renault-car-image-wrap">
                            <img className="renault-car-image" src="/symbioz.png" alt="Symbioz" />
                        </div>

                        <div className="renault-car-grid">
                            <div className="parallelogramStyle">
                                <span className="labelStyle">Kilométrage</span>
                                <span className="valueStyle">{dataCar.mileage ? `${dataCar.mileage} km` : 'N/C'}</span>
                            </div>
                            <div className="parallelogramStyle">
                                <span className="labelStyle">Autonomie</span>
                                <span className="valueStyle">{dataCar.fuel_autonomy_km ? `${dataCar.fuel_autonomy_km} km` : 'N/C'}</span>
                            </div>
                            <div className="parallelogramStyle">
                                <span className="labelStyle">Carburant</span>
                                <span className="valueStyle">{dataCar.fuel_quantity_l ? `${dataCar.fuel_quantity_l} L` : 'N/C'}</span>
                            </div>
                            <div className={`parallelogramStyle ${isUnder50 ? 'parallelogramStyle-alert' : 'parallelogramStyle-normal'}`}>
                                <span className="labelStyle">Niveau</span>
                                <span className={`valueStyle ${isUnder50 ? 'valueStyle-alert' : 'valueStyle-normal'}`}>
                                    {dataCar.fuel_percentage ? `${(dataCar.fuel_percentage).toFixed(0)}%` : 'N/C'}
                                </span>
                            </div>
                        </div>

                        {isUnder50 && (
                            <div className="renault-car-alert">
                                Autonomie sous les 50% : pensez à faire le plein.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PdaCard>
    );
}
