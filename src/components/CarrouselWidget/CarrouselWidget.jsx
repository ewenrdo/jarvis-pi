import React, { useState, useEffect } from 'react';
import PdaCard from '../PdaCard/PdaCard';

// Liste de vos photos stockées dans public/carrousel/
const CAROUSEL_IMAGES = [
  '/carrousel/photo1.jpeg',
  '/carrousel/photo2.jpeg',
  '/carrousel/photo3.jpeg',
  '/carrousel/photo4.jpeg',
  '/carrousel/photo5.jpeg',
  '/carrousel/photo6.jpeg'
];

export default function CarrouselWidget({ focused }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Changement automatique de photo toutes les 12 secondes avec fondu
  useEffect(() => {
    let isSubscribed = true;

    const photoTimer = setInterval(() => {
      if (isSubscribed) {
        setCurrentPhotoIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
      }
    }, 12000);

    return () => {
      isSubscribed = false;
      clearInterval(photoTimer);
    };
  }, []);

  return (
    <PdaCard focused={focused} title="" icon="" className="carousel-card" style={{ flex: 1, padding: 0 }}>
        <div className="carousel-widget-full">
          {/* Slides avec gestion de la classe active pour la transition en fondu */}
          {CAROUSEL_IMAGES.map((imgUrl, index) => (
            <div
              key={imgUrl}
              className={`carousel-slide ${index === currentPhotoIndex ? 'active' : ''}`}
              style={{ backgroundImage: `url(${imgUrl})` }}
            />
          ))}

          {/* Dégradé supérieur pour la lisibilité */}
          <div className="carousel-overlay-top" />

          {/* Texte et indicateur positionnés au DESSUS de l'image */}
          <div className="carousel-header-text">
            <span>Galerie Jarvis</span>
            <span className="carousel-counter">
              {currentPhotoIndex + 1} / {CAROUSEL_IMAGES.length}
            </span>
          </div>
        </div>
    </PdaCard>
  );
}