import React, { useState } from "react";
import "./ImageGallery.css";

const ImageGallery = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  const openImage = (src) => setSelectedImage(src);
  const closeModal = () => setSelectedImage(null);

  const downloadImage = () => {
    const link = document.createElement("a");
    link.href = selectedImage;
    link.download = "download.jpg";
    link.click();
  };

  return (
    <>
      <div className="gallery">
        {images.map((src, i) => (
          <div className="image-card" key={i} onClick={() => openImage(src)}>
            {/* ✅ Use a meaningful or generic description, no 'image' word */}
            <img src={src} alt={`Artwork ${i + 1}`} />
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* ✅ If image is decorative in modal, use empty alt */}
            <img src={selectedImage} alt="" />
            <div className="modal-buttons">
              <button onClick={downloadImage}>Download</button>
              <button onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;
