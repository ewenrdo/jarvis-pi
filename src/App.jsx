import React, { useState, useEffect, useRef } from 'react';
import './styles/main.scss';
import AgendaWidget from './components/AgendaWidget/AgendaWidget';
import CarrouselWidget from './components/CarrouselWidget/CarrouselWidget';
import ParoleWidget from './components/ParoleWidget/ParoleWidget';
import WeatherWidget from './components/WeatherWidget/WeatherWidget';
import FlashNewsWidget from './components/FlashNewsWidget/FlashNewsWidget';
import TransportWidget from './components/TransportWidget/TransportWidget';
import ParoleModal from './components/ParoleModal/ParoleModal';
import AppsMenuModal from './components/AppsMenuModal/AppsMenuModal';

const DEFAULT_BG = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop";

const APPS_LIST = [
  { id: 3, name: "Netflix", action: "kodi-addon", target: "plugin.video.netflix", iconUrl: "/apps/netflix.png" },
  { id: 4, name: "YouTube", action: "kodi-addon", target: "plugin.video.youtube", iconUrl: "/apps/youtube.png" },
  { id: 5, name: "Prime Vidéo", action: "kodi-addon", target: "plugin.video.primevideo", iconUrl: "/apps/prime.png" },
];

export default function App() {
  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const TOTAL_WIDGETS = 6;

  const [agendaDate, setAgendaDate] = useState(new Date());
  const [isAgendaLocked, setIsAgendaLocked] = useState(false);

  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [selectedAppIndex, setSelectedAppIndex] = useState(0);

  const [parole, setParole] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const agendaContainerRef = useRef(null);
  const modalBodyRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
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
    const handleKeyDown = (e) => {
      if (showModal) {
        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Enter' || e.key === ' ') {
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

      if (showAppsMenu) {
        if (e.key === 'Escape' || e.key === 'Backspace') {
          setShowAppsMenu(false);
        } else if (e.key === 'ArrowRight') {
          setSelectedAppIndex((prev) => (prev + 1) % APPS_LIST.length);
        } else if (e.key === 'ArrowLeft') {
          setSelectedAppIndex((prev) => (prev - 1 + APPS_LIST.length) % APPS_LIST.length);
        } else if (e.key === 'ArrowDown') {
          setSelectedAppIndex((prev) => (prev + 3 < APPS_LIST.length ? prev + 3 : prev));
        } else if (e.key === 'ArrowUp') {
          setSelectedAppIndex((prev) => (prev - 3 >= 0 ? prev - 3 : prev));
        } else if (e.key === 'Enter' || e.key === ' ') {
          const currentApp = APPS_LIST[selectedAppIndex];
          
          if (currentApp) {
            if (currentApp.action === "url") {
              window.open(currentApp.target, '_blank');
            } else if (currentApp.action === "kodi-addon") {
              fetch('/jsonrpc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: "2.0",
                  method: "Addons.ExecuteAddon",
                  params: { addonid: currentApp.target },
                  id: 1
                })
              })
              .then(res => res.json())
              .then(data => console.log("Kodi a lancé l'app :", data))
              .catch(err => console.error("Erreur de communication avec Kodi :", err));
            } else if (currentApp.action === "gallery") {
              console.log("Ouverture de la galerie Jarvis");
            }
          }

          setShowAppsMenu(false);
        }
        return;
      }

      if (focusedIndex === 0) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsAgendaLocked((prev) => !prev);
          return;
        }

        if (isAgendaLocked) {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            setAgendaDate((prevDate) => {
              const newDate = new Date(prevDate);
              newDate.setDate(newDate.getDate() + (e.key === 'ArrowRight' ? 1 : -1));
              return newDate;
            });
            return;
          } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
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
        } else {
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
      }

      if (e.key === 'Enter' || e.key === ' ') {
        if (focusedIndex === 2) {
          setShowModal(true);
        } else if (focusedIndex !== 0) {
          setShowAppsMenu(true);
          setSelectedAppIndex(0);
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        setIsAgendaLocked(false);
      }

      switch (e.key) {
        case 'ArrowRight': setFocusedIndex((prev) => (prev + 1) % TOTAL_WIDGETS); break;
        case 'ArrowLeft': setFocusedIndex((prev) => (prev - 1 + TOTAL_WIDGETS) % TOTAL_WIDGETS); break;
        case 'ArrowDown': setFocusedIndex((prev) => (prev + 1 < TOTAL_WIDGETS ? prev + 1 : prev)); break;
        case 'ArrowUp': setFocusedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev)); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, showModal, isAgendaLocked, showAppsMenu, selectedAppIndex]);

  const isTodayAgenda = new Date().toDateString() === agendaDate.toDateString();
  const formattedAgendaDateLabel = agendaDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <div className="bg-image" style={{ backgroundImage: `url(${DEFAULT_BG})` }} />
      <div className="bg-overlay" />

      <div className="pda-shell">
        <header className="pda-header">
          <div className="clock-block">
            <div className="time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="date">{time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>

          <div className="top-right-cluster">
            <div className="jarvis-logo-inline">
              <span className="jarvis-text">JARVIS</span>
              <span className="jarvis-subtext">JARVIS OS 1.0</span>
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
          <AgendaWidget
            focused={focusedIndex === 0}
            isOnline={isOnline}
            isAgendaLocked={isAgendaLocked}
            isTodayAgenda={isTodayAgenda}
            formattedAgendaDateLabel={formattedAgendaDateLabel}
            agendaDate={agendaDate}
            agendaContainerRef={agendaContainerRef}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <CarrouselWidget focused={focusedIndex === 1} />
            <ParoleWidget focused={focusedIndex === 2} isOnline={isOnline} onOpen={() => setShowModal(true)} onParoleLoaded={setParole} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <WeatherWidget focused={focusedIndex === 3} isOnline={isOnline} />
            <FlashNewsWidget focused={focusedIndex === 4} isOnline={isOnline} />
            <TransportWidget focused={focusedIndex === 5} isOnline={isOnline} />
          </div>
        </div>
      </div>

      {showModal && parole && (
        <ParoleModal parole={parole} modalBodyRef={modalBodyRef} onClose={() => setShowModal(false)} />
      )}

      {showAppsMenu && (
        <AppsMenuModal apps={APPS_LIST} selectedAppIndex={selectedAppIndex} onClose={() => setShowAppsMenu(false)} />
      )}
    </>
  );
}