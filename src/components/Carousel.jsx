import React, { useState, useEffect } from 'react';
import './Carousel.css';

function Carousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  if (!images || images.length === 0) return null;

  return (
    <div className="carousel">
      <div className="carousel-container">
        <button className="carousel-button prev" onClick={prevSlide}>
          &#10094;
        </button>
        <div className="carousel-slide">
          <img src={images[currentIndex]} alt={`Storia ${currentIndex + 1}`} />
        </div>
        <button className="carousel-button next" onClick={nextSlide}>
          &#10095;
        </button>
      </div>
      <div className="carousel-indicators">
        {images.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default Carousel;
