import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import "./Lightbox.css";

function Lightbox({ images = [], index, onClose, onPrev, onNext }) {
  const isOpen = index !== null && index !== undefined && images[index];

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen) return null;

  const hasMultiple = images.length > 1;

  // The portfolio page uses a transform for its entrance animation. Rendering
  // the lightbox in document.body keeps its fixed positioning relative to the
  // viewport instead of that transformed page container.
  return createPortal(
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <button className="lightbox-close" onClick={onClose} aria-label="Chiudi">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {hasMultiple && (
        <button
          className="lightbox-nav lightbox-prev"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Immagine precedente"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}

      <img
        src={images[index]}
        alt="Preview"
        className="lightbox-image"
        onClick={(e) => e.stopPropagation()}
      />

      {hasMultiple && (
        <button
          className="lightbox-nav lightbox-next"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Immagine successiva"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      )}

      {hasMultiple && (
        <div className="lightbox-counter">
          {index + 1} / {images.length}
        </div>
      )}
    </div>,
    document.body,
  );
}

export default Lightbox;
