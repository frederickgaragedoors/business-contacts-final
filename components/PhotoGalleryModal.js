import React, { useState, useEffect, useCallback } from 'react';
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from './icons.js';

const PhotoGalleryModal = ({ images, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToPrevious, goToNext, onClose]);
  
  if (!images || images.length === 0) {
    return null;
  }

  return (
    React.createElement("div", { className: "fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50", role: "dialog", "aria-modal": "true" },
      React.createElement("div", { className: "relative w-full h-full flex flex-col items-center justify-center p-4" },
        React.createElement("button", {
          onClick: onClose,
          className: "absolute top-4 right-4 text-white hover:text-slate-300 z-50 p-2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full",
          "aria-label": "Close gallery"
        },
          React.createElement(XIcon, { className: "w-6 h-6" })
        ),
        React.createElement("div", { className: "relative w-full max-w-4xl h-full max-h-[85vh] flex items-center justify-center" },
            React.createElement("div", { className: "w-full h-full flex items-center justify-center" },
                React.createElement("img", {
                    src: images[currentIndex].url,
                    alt: images[currentIndex].name,
                    className: "max-h-full max-w-full object-contain"
                })
            ),
            images.length > 1 && (
                React.createElement("button", {
                    onClick: goToPrevious,
                    className: "absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 p-2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full",
                    "aria-label": "Previous image"
                },
                    React.createElement(ChevronLeftIcon, { className: "w-8 h-8" })
                )
            ),
            images.length > 1 && (
                React.createElement("button", {
                    onClick: goToNext,
                    className: "absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 text-white hover:text-slate-300 p-2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full",
                    "aria-label": "Next image"
                },
                    React.createElement(ChevronRightIcon, { className: "w-8 h-8" })
                )
            )
        ),
        React.createElement("div", { className: "text-white text-center mt-2" },
            React.createElement("p", { className: "text-lg font-medium" }, images[currentIndex].name),
            images.length > 1 && (
                React.createElement("p", { className: "text-sm text-slate-300" }, `${currentIndex + 1} / ${images.length}`)
            )
        )
      )
    )
  );
};

export default PhotoGalleryModal;