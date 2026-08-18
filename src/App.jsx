import React, { useState, useEffect, useRef, memo } from 'react';
import './styles/main.scss';
import './styles/loading.scss';
import './styles/offline.scss';
import AgendaWidget from './components/AgendaWidget/AgendaWidget';
import CarrouselWidget from './components/CarrouselWidget/CarrouselWidget';
import ParoleWidget from './components/ParoleWidget/ParoleWidget';
import WeatherWidget from './components/WeatherWidget/WeatherWidget';
import FlashNewsWidget from './components/FlashNewsWidget/FlashNewsWidget';
import TransportWidget from './components/TransportWidget/TransportWidget';
import ParoleModal from './components/ParoleModal/ParoleModal';
import AppsMenuModal from './components/AppsMenuModal/AppsMenuModal';
import RenaultCarWidget from './components/RenaultCarWidget/RenaultCarWidget';
import useSound from 'use-sound';

import switchSound from './assets/sounds/switch.mp3';
import notificationSound from './assets/sounds/notification.mp3';
import menuSound from './assets/sounds/menu.mp3';

const DEFAULT_BG = "https://images.unsplash.com/photo-1774434923581-91ed9d8ee79b?q=80&w=1920&auto=format&fit=crop";
const JARVIS_SERVER_URL = import.meta.env.VITE_JARVIS_SERVER_URL || 'http://localhost:5788';
const NETWORK_CHECK_URL = 'https://www.google.com/generate_204';

const APPS_LIST = [
    { id: 3, name: "Netflix", action: "kodi-addon", target: "plugin.video.netflix", iconUrl: "/apps/netflix.png" },
    { id: 4, name: "YouTube", action: "kodi-addon", target: "plugin.video.youtube", iconUrl: "/apps/youtube.png" },
    { id: 5, name: "Prime Vidéo", action: "kodi-addon", target: "plugin.video.primevideo", iconUrl: "/apps/prime.png" },
];

// Composant d'horloge isolé pour éviter de rafraîchir tout le layout global chaque seconde
const LiveClock = memo(function LiveClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="clock-block">
            <div className="time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="date">{time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
    );
});

export default function App() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isLoading, setIsLoading] = useState(true);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const TOTAL_WIDGETS = 7;

    const [agendaDate, setAgendaDate] = useState(new Date());
    const [isAgendaLocked, setIsAgendaLocked] = useState(false);

    const [showAppsMenu, setShowAppsMenu] = useState(false);
    const [selectedAppIndex, setSelectedAppIndex] = useState(0);

    const [parole, setParole] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [activeNotificationIndex, setActiveNotificationIndex] = useState(null);

    const agendaContainerRef = useRef(null);
    const modalBodyRef = useRef(null);

    const [playSwitch] = useSound(switchSound);
    const [playNotification] = useSound(notificationSound);
    const [playMenu] = useSound(menuSound);

    // Utilisation de refs pour stocker l'état actuel et éviter de recréer l'écouteur clavier en boucle
    const stateRef = useRef({
        activeNotificationIndex,
        currentNotification: notifications[activeNotificationIndex] ?? null,
        focusedIndex,
        showModal,
        isAgendaLocked,
        showAppsMenu,
        selectedAppIndex,
        notificationsLength: notifications.length
    });

    useEffect(() => {
        stateRef.current = {
            activeNotificationIndex,
            currentNotification: notifications[activeNotificationIndex] ?? null,
            focusedIndex,
            showModal,
            isAgendaLocked,
            showAppsMenu,
            selectedAppIndex,
            notificationsLength: notifications.length
        };
    });

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch(`${JARVIS_SERVER_URL}/api/notifications`);
                if (!response.ok) throw new Error('Erreur de récupération des notifications');
                const data = await response.json();
                setNotifications(data);
                setActiveNotificationIndex(data.length > 0 ? 0 : null);
                if(data.length > 0) {
                    playNotification();
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des notifications :', error);
                setNotifications([]);
            }
        };

        fetchNotifications();
        const notificationsTimer = setInterval(fetchNotifications, 60 * 1000);
        return () => clearInterval(notificationsTimer);
    }, [playNotification]);

    useEffect(() => {
        const bootTimer = window.setTimeout(() => setIsLoading(false), 1 * 1000);
        return () => window.clearTimeout(bootTimer);
    }, []);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        let isCancelled = false;

        const checkNetwork = async () => {
            if (!navigator.onLine) {
                if (!isCancelled) setIsOnline(false);
                return;
            }

            try {
                const controller = new AbortController();
                const timeoutId = window.setTimeout(() => controller.abort(), 5000);

                await fetch(NETWORK_CHECK_URL, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-store',
                    signal: controller.signal,
                });

                window.clearTimeout(timeoutId);
                if (!isCancelled) setIsOnline(true);
            } catch {
                if (!isCancelled) setIsOnline(false);
            }
        };

        checkNetwork();
        const networkTimer = window.setInterval(checkNetwork, 15000);

        return () => {
            isCancelled = true;
            window.clearInterval(networkTimer);
        };
    }, []);

    const handleNotificationClose = async () => {
        const { activeNotificationIndex, currentNotification, notificationsLength } = stateRef.current;
        if (activeNotificationIndex !== null && currentNotification) {
            const response = await fetch(`${JARVIS_SERVER_URL}/api/notifications/${currentNotification.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                setNotifications((prev) => prev.filter((_, index) => index !== activeNotificationIndex));
                setActiveNotificationIndex((prevIndex => {
                    if (prevIndex === null) return null;
                    const newIndex = prevIndex - 1;
                    return newIndex >= 0 ? newIndex : (notificationsLength > 1 ? 0 : null);
                }));
            } else {
                console.error('Erreur lors de la suppression de la notification :', response.statusText);
            }
        }
    };

    // Écouteur global monté une seule fois pour éviter les saccades de recréation
    useEffect(() => {
        const handleKeyDown = (e) => {
            const currentSt = stateRef.current;
            const currentNotif = currentSt.currentNotification;

            if (e.key === 'BrowserBack' || e.key === 'Backspace') {
                e.preventDefault();
                e.stopPropagation();
                
                if (currentSt.showModal) {
                    setShowModal(false);
                } else if (currentSt.showAppsMenu) {
                    setShowAppsMenu(false);
                } else {
                    setFocusedIndex(0);
                }
                return;
            }

            if (currentNotif) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleNotificationClose();
                }
                return;
            }

            if (currentSt.showModal) {
                if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
                    setShowModal(false);
                } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    if (modalBodyRef.current) {
                        e.preventDefault();
                        const scrollAmount = 60;
                        modalBodyRef.current.scrollBy({
                            top: e.key === 'ArrowDown' ? scrollAmount : -scrollAmount,
                            behavior: 'smooth'
                        });
                    }
                }
                return;
            }

            if (currentSt.showAppsMenu) {
                if (e.key === 'Escape') {
                    setShowAppsMenu(false);
                } else if (e.key === 'ArrowRight') {
                    setSelectedAppIndex((prev) => (prev + 1) % APPS_LIST.length);
                    playSwitch();
                } else if (e.key === 'ArrowLeft') {
                    setSelectedAppIndex((prev) => (prev - 1 + APPS_LIST.length) % APPS_LIST.length);
                    playSwitch();
                } else if (e.key === 'ArrowDown') {
                    setSelectedAppIndex((prev) => (prev + 3 < APPS_LIST.length ? prev + 3 : prev));
                    playSwitch();
                } else if (e.key === 'ArrowUp') {
                    setSelectedAppIndex((prev) => (prev - 3 >= 0 ? prev - 3 : prev));
                    playSwitch();
                } else if (e.key === 'Enter' || e.key === ' ') {
                    const currentApp = APPS_LIST[currentSt.selectedAppIndex];

                    if (currentApp) {
                        if (currentApp.action === "url") {
                            window.open(currentApp.target, '_blank');
                        } else if (currentApp.action === "kodi-addon") {
                            fetch(`${JARVIS_SERVER_URL}/api/launch`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ addonid: currentApp.target })
                            }).catch(err => console.error("Erreur serveur Jarvis :", err));
                        }
                    }
                    setShowAppsMenu(false);
                }
                return;
            }

            if (currentSt.focusedIndex === 0) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsAgendaLocked((prev) => !prev);
                    return;
                }

                if (currentSt.isAgendaLocked) {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                        e.preventDefault();
                        setAgendaDate((prevDate) => {
                            const newDate = new Date(prevDate);
                            newDate.setDate(newDate.getDate() + (e.key === 'ArrowRight' ? 1 : -1));
                            return newDate;
                        });
                        return;
                    }
                }
                
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    if (agendaContainerRef.current) {
                        e.preventDefault();
                        const scrollAmount = 60;
                        agendaContainerRef.current.scrollBy({
                            top: e.key === 'ArrowDown' ? scrollAmount : -scrollAmount,
                            behavior: 'smooth'
                        });
                    }
                    return;
                }
            }

            if (e.key === 'Enter' || e.key === ' ') {
                if (currentSt.focusedIndex === 3) {
                    setShowModal(true);
                } else if (currentSt.focusedIndex !== 0) {
                    setShowAppsMenu(true);
                    playMenu();
                    setSelectedAppIndex(0);
                }
                return;
            }

            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                setIsAgendaLocked(false);
            }

            switch (e.key) {
                case 'ArrowRight': setFocusedIndex((prev) => (prev + 1) % TOTAL_WIDGETS); playSwitch(); break;
                case 'ArrowLeft': setFocusedIndex((prev) => (prev - 1 + TOTAL_WIDGETS) % TOTAL_WIDGETS); playSwitch(); break;
                case 'ArrowDown': setFocusedIndex((prev) => (prev + 1 < TOTAL_WIDGETS ? prev + 1 : prev)); playSwitch(); break;
                case 'ArrowUp': setFocusedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev)); playSwitch(); break;
                default: break;
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [playSwitch, playMenu]); // Dépendances stables uniquement

    const currentNotification = notifications[activeNotificationIndex] ?? null;
    const isTodayAgenda = new Date().toDateString() === agendaDate.toDateString();
    const formattedAgendaDateLabel = agendaDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    if (isLoading) {
        return (
            <div className="loading-screen" role="status" aria-live="polite">
                <div className="loading-backdrop" />
                <div className="loading-shell">
                    <div className="loading-rings" aria-hidden="true"><span /><span /><span /></div>
                    <div className="loading-wordmark">
                        <span className="loading-kicker">Boot sequence</span>
                        <span className="loading-title">Jarvis</span>
                        <span className="loading-subtitle">Initialisation de l’interface</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!isOnline) {
        return (
            <div className="offline-screen" role="status" aria-live="polite">
                <div className="offline-backdrop" />
                <div className="offline-shell">
                    <div className="offline-wordmark">
                        <span className="offline-kicker">Network status</span>
                        <span className="offline-title">Jarvis</span>
                        <span className="offline-subtitle">Connexion réseau indisponible</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-image" style={{ backgroundImage: `url(${DEFAULT_BG})` }} />
            <div className="bg-overlay" />

            <div className="pda-shell">
                <header className="pda-header">
                    <LiveClock />

                    <div className="top-right-cluster">
                        <div className="jarvis-logo-inline">
                            <span className="jarvis-text">JARVIS</span>
                            <span className="jarvis-subtext">JARVIS OS 1.1</span>
                        </div>
                        <div className="status-badges">
                            <div className={`badge ${isOnline ? 'online' : 'offline'}`}>
                                <span className="dot">•</span> {isOnline ? 'Connecté' : 'Hors-ligne'}
                            </div>
                            <div className="badge remote"><span>🎮</span> Remote</div>
                        </div>
                    </div>
                </header>

                <div className="widgets-grid">
                    <div className="agenda-transport-stack">
                        <div className="agenda-slot">
                            <AgendaWidget
                                focused={focusedIndex === 0}
                                isOnline={isOnline}
                                isAgendaLocked={isAgendaLocked}
                                isTodayAgenda={isTodayAgenda}
                                formattedAgendaDateLabel={formattedAgendaDateLabel}
                                agendaDate={agendaDate}
                                agendaContainerRef={agendaContainerRef}
                            />
                        </div>
                        <div className="transport-slot">
                            <TransportWidget focused={focusedIndex === 1} isOnline={isOnline} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <CarrouselWidget focused={focusedIndex === 2} />
                        <ParoleWidget focused={focusedIndex === 3} isOnline={isOnline} onOpen={() => setShowModal(true)} onParoleLoaded={setParole} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <WeatherWidget focused={focusedIndex === 4} isOnline={isOnline} />
                        <FlashNewsWidget focused={focusedIndex === 5} isOnline={isOnline} />
                        <RenaultCarWidget focused={focusedIndex === 6} isOnline={isOnline} />
                    </div>
                </div>
            </div>

            {showModal && parole && (
                <ParoleModal parole={parole} modalBodyRef={modalBodyRef} onClose={() => setShowModal(false)} />
            )}

            {showAppsMenu && (
                <AppsMenuModal apps={APPS_LIST} selectedAppIndex={selectedAppIndex} onClose={() => setShowAppsMenu(false)} />
            )}

            {currentNotification && (
                <div className="notification-overlay" role="dialog" aria-modal="true">
                    <div className="notification-modal">
                        <div className="notification-counter">{activeNotificationIndex + 1} / {notifications.length}</div>
                        <div className="notification-header">
                            <h2>{currentNotification.title}</h2>
                        </div>
                        <p>{currentNotification.content}</p>
                        <div className="notification-actions">
                            <button type="button" className="notification-ok" onClick={handleNotificationClose}>
                                D'accord
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}