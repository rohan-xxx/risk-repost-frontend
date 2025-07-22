import React from "react";

function ImageGallery({ images }) {
  return (
    <div className="gallery">
      {images.map((src, index) => (
        <div key={index} className="image-card">
          <img src={src} alt={`upload-${index}`} />
        </div>
      ))}
    </div>
  );
}

export default ImageGallery;
