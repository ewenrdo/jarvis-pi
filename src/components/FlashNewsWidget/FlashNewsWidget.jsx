import React, { useEffect, useState } from 'react';
import PdaCard from '../PdaCard/PdaCard';

export default function FlashNewsWidget({ focused, isOnline }) {
  const [flashNews, setFlashNews] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  useEffect(() => {
    let isSubscribed = true;

    const fetchAllNews = async () => {
      if (!isOnline) {
        if (isSubscribed) {
          setNewsError('Hors ligne');
          setIsNewsLoading(false);
        }
        return;
      }

      if (isSubscribed) {
        setIsNewsLoading(true);
        setNewsError(null);
      }

      try {
        const sources = [
          { name: 'France Info', url: 'https://www.franceinfo.fr/titres.rss' },
          { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml' }
        ];

        const requests = sources.map(source =>
          fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`)
            .then(res => res.json())
            .then(data => ({ source: source.name, items: data.items || [] }))
        );

        const results = await Promise.allSettled(requests);

        let combinedArticles = [];

        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value.items.length > 0) {
            const sourceArticles = result.value.items.map(item => ({
              tag: result.value.source,
              title: item.title,
              link: item.link,
              pubDate: new Date(item.pubDate).getTime() // Pour le tri chronologique
            }));
            combinedArticles.push(...sourceArticles);
          }
        });

        if (combinedArticles.length > 0 && isSubscribed) {
          // Tri du plus récent au plus ancien
          combinedArticles.sort((a, b) => b.pubDate - a.pubDate);

          // Re-numérotation des identifiants uniques
          const formattedArticles = combinedArticles.map((article, index) => ({
            id: index + 1,
            tag: article.tag,
            title: article.title,
            link: article.link
          }));

          setFlashNews(formattedArticles.slice(0, 10)); // Limite à 10 articles
          setCurrentNewsIndex(0);
        } else if (isSubscribed) {
          throw new Error('Aucun article disponible');
        }
      } catch {
        if (isSubscribed) {
          setNewsError('Impossible de charger les actualités');
          setFlashNews([]);
        }
      } finally {
        if (isSubscribed) {
          setIsNewsLoading(false);
        }
      }
    };
    fetchAllNews();
    const newsInterval = setInterval(fetchAllNews, 1800000);

    return () => {
      isSubscribed = false;
      clearInterval(newsInterval);
    };
  }, [isOnline]);

  useEffect(() => {
    if (flashNews.length === 0) return;
    const newsTimer = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % flashNews.length);
    }, 10 * 1000);
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