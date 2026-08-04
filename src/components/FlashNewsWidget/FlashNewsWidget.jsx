import React, { useEffect, useState } from 'react';
import PdaCard from '../PdaCard/PdaCard';

export default function FlashNewsWidget({ focused, isOnline }) {
  const [flashNews, setFlashNews] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  useEffect(() => {
    const fetchFranceInfoNews = async () => {
      if (!isOnline) {
        setNewsError('Hors ligne');
        setIsNewsLoading(false);
        return;
      }

      setIsNewsLoading(true);
      setNewsError(null);

      try {
        const rssUrl = encodeURIComponent('https://www.franceinfo.fr/titres.rss');
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        if (!response.ok) throw new Error('Erreur de récupération du flux');

        const data = await response.json();
        if (data && data.items && data.items.length > 0) {
          const articles = data.items.map((item, index) => ({
            id: index + 1,
            tag: 'France Info',
            title: item.title,
            link: item.link
          }));
          setFlashNews(articles);
          setCurrentNewsIndex(0);
        } else {
          throw new Error('Aucun article disponible');
        }
      } catch {
        setNewsError('Impossible de charger les actualités');
        setFlashNews([]);
      } finally {
        setIsNewsLoading(false);
      }
    };

    fetchFranceInfoNews();
    const newsInterval = setInterval(fetchFranceInfoNews, 1800000);
    return () => clearInterval(newsInterval);
  }, [isOnline]);

  useEffect(() => {
    if (flashNews.length === 0) return;
    const newsTimer = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % flashNews.length);
    }, 6000);
    return () => clearInterval(newsTimer);
  }, [flashNews.length]);

  const headerRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {!isNewsLoading && !newsError && flashNews.length > 0 && (
        <span style={{ fontSize: '0.75rem', color: '#8b949e', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
          {currentNewsIndex + 1}/{flashNews.length}
        </span>
      )}
      <span className="icon">⚡</span>
    </div>
  );

  return (
    <PdaCard focused={focused} title="Flash-Info" headerRight={headerRight} style={{ flex: '0 0 auto' }}>
      {isNewsLoading ? (
        <div style={{ fontSize: '0.8rem', color: '#8b949e', textAlign: 'center', padding: '12px 0' }}>Chargement des flashs...</div>
      ) : newsError ? (
        <div style={{ fontSize: '0.8rem', color: '#ff7b72', textAlign: 'center', padding: '12px 0' }}>⚠️ {newsError}</div>
      ) : flashNews.length === 0 ? (
        <div style={{ fontSize: '0.8rem', color: '#8b949e', textAlign: 'center', padding: '12px 0' }}>Aucune actualité disponible.</div>
      ) : (
        <div className="flash-news-container">
          <div className="flash-news-badge">{flashNews[currentNewsIndex].tag}</div>
          <div className="flash-news-text animate-fade">{flashNews[currentNewsIndex].title}</div>
        </div>
      )}
    </PdaCard>
  );
}