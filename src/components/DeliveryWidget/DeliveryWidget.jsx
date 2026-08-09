import React, { useEffect, useState } from 'react';
import PdaCard from '../PdaCard/PdaCard';

const MOCK_DELIVERIES = [
    {
        id: 1,
        status: 'En cours de livraison',
        estimatedDelivery: '2024-06-15T14:30:00Z',
        trackingNumber: '1234567890',
        carrier: 'Colissimo',
    },
    {
        id: 2,
        status: 'Livré',
        estimatedDelivery: '2024-06-14T10:00:00Z',
        trackingNumber: '0987654321',
        carrier: 'LaPoste',
    },
    {
        id: 3,
        status: 'En cours de livraison',
        estimatedDelivery: '2024-06-14T10:00:00Z',
        trackingNumber: '0987654321',
        carrier: 'Amazon',
    },
    {
        id: 4,
        status: 'En cours de livraison',
        estimatedDelivery: '2024-06-14T10:00:00Z',
        trackingNumber: '0987654321',
        carrier: 'DHL',
    },
    {
        id: 5,
        status: 'En cours de livraison',
        estimatedDelivery: '2024-06-14T10:00:00Z',
        trackingNumber: '0987654321',
        carrier: 'COLIS PRIVÉ',
    },
];

export default function DeliveryWidget({ focused, isOnline }) {
    const [deliveries, setDeliveries] = useState([]);
    const [isDeliveryLoading, setIsDeliveryLoading] = useState(true);
    const [deliveryError, setDeliveryError] = useState(null);

    useEffect(() => {
        setIsDeliveryLoading(false);
        setDeliveries(MOCK_DELIVERIES);
    }, [isOnline]);

    return (
        <PdaCard focused={focused} title="Prochaines livraisons" icon="📦" style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div className="transport-scroll-area" style={{ maxHeight: '210px', overflowY: 'auto' }}>
                    {isDeliveryLoading ? (
                        <div style={{ fontSize: '0.8rem', color: '#8b949e', textAlign: 'center', padding: '10px' }}>Chargement des prochaines livraisons...</div>
                    ) : deliveryError ? (
                        <div style={{ fontSize: '0.8rem', color: '#ff7b72', textAlign: 'center', padding: '15px 10px' }}>⚠️ {deliveryError}</div>
                    ) : deliveries.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: '#8b949e', textAlign: 'center', padding: '15px 10px' }}>Aucun colis n'est en cours de livraison.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '1rem' }}>
                            {deliveries.map((item) => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem .75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#c9d1d9', marginTop: '2px', fontWeight: 500 }}>
                                            <span style={{ fontWeight: 'bold', padding: '.75rem 2rem', backgroundColor: item.status === "Livré" ? 'rgba(63, 228, 93, 0.15)' : 'rgba(88, 166, 255, 0.15)', borderRadius: '8px', borderColor: 'rgba(88, 166, 255, 0.15)', color: item.status === "Livré" ? '#3fe45d' : '#58a6ff', marginRight: '1rem', minWidth: '9rem', display: 'inline-block', textAlign: 'center' }}>
                                                {item.carrier.toUpperCase()}
                                            </span>
                                            {item.status}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>
                                        {item.status === 'delayed' ? 'Retardé' : new Date(item.estimatedDelivery).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'long' })}
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