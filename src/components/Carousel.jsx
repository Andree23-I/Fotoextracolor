import React, { useState, useEffect } from 'react';
import './Carousel.css';

function Carousel({ images, language = 'it' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeveloped, setIsDeveloped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  useEffect(() => {
    // Auto slide every 6 seconds if not hovered
    if (isHovered || !images || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isHovered, images]);

  if (!images || images.length === 0) return null;

  const currentFrameNumber = String(currentIndex + 1).padStart(2, '0');
  const showPositive = isHovered || isDeveloped;

  return (
    <div className="carousel-film-wrapper">
      {/* 35mm Film Frame Container */}
      <div 
        className={`carousel-film-frame ${showPositive ? 'is-developed' : 'is-negative'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top Sprocket Perforations */}
        <div className="carousel-sprockets top">
          <span className="sprocket-hole"></span>
          <span className="sprocket-hole"></span>
          <span className="sprocket-hole hide-mobile"></span>
          <span className="carousel-film-code">
            EXTRACOLOR 400 • ▶ {currentFrameNumber}A • SAFETY FILM
          </span>
          <span className="sprocket-hole hide-mobile"></span>
          <span className="sprocket-hole"></span>
          <span className="sprocket-hole"></span>
        </div>

        {/* Central Film Photo Window with Carousel controls */}
        <div className="carousel-photo-window" onClick={() => setIsDeveloped(prev => !prev)}>
          {/* Laser HUD reticle overlay */}
          <div className="carousel-hud-overlay" aria-hidden="true">
            <span className="hud-corner-sm hud-tl"></span>
            <span className="hud-corner-sm hud-tr"></span>
            <span className="hud-corner-sm hud-bl"></span>
            <span className="hud-corner-sm hud-br"></span>
          </div>

          <button
            type="button"
            className="carousel-button prev"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Foto precedente"
          >
            &#10094;
          </button>

          <div className="carousel-slide-content">
            <img
              src={images[currentIndex]}
              alt={`Archivio Storico ${currentIndex + 1}`}
              className="carousel-film-img"
              loading="lazy"
              decoding="async"
              key={currentIndex}
            />
          </div>

          <button
            type="button"
            className="carousel-button next"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Foto successiva"
          >
            &#10095;
          </button>

          {/* Status badge in corner */}
          <div className="carousel-status-badge">
            <span className="status-dot"></span>
            <span>
              {showPositive 
                ? (language === 'en' ? 'DEVELOPED' : 'SVILUPPATO') 
                : (language === 'en' ? 'RAW NEGATIVE' : 'NEGATIVO 35mm')}
            </span>
          </div>

          <div className="carousel-frame-tag">
            [{currentFrameNumber}/{String(images.length).padStart(2, '0')}]
          </div>
        </div>

        {/* Bottom Sprocket Perforations */}
        <div className="carousel-sprockets bottom">
          <span className="sprocket-hole"></span>
          <span className="sprocket-hole"></span>
          <span className="sprocket-hole hide-mobile"></span>
          <span className="carousel-film-code">
            EMULSION // SALERNO ARCHIVE • ISO 400
          </span>
          <span className="sprocket-hole hide-mobile"></span>
          <span className="sprocket-hole"></span>
          <span className="sprocket-hole"></span>
        </div>
      </div>

      {/* Interactive Helper & Toggle Controls */}
      <div className="carousel-film-footer">
        <button 
          type="button" 
          className={`carousel-dev-toggle-btn ${isDeveloped ? 'active' : ''}`}
          onClick={() => setIsDeveloped(prev => !prev)}
        >
          {isDeveloped ? '🧪 Torna al Negativo' : '✨ Sviluppa Foto'}
        </button>
        <span className="carousel-interactive-hint">
          {language === 'en'
            ? 'Hover or tap to reveal positive color'
            : 'Passa il mouse o tocca per rivelare il colore'}
        </span>
      </div>

      {/* Indicators */}
      <div className="carousel-indicators">
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Vai alla foto ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default Carousel;
