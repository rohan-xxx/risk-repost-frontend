import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import ImageUpload from "./ImageUpload";

function App() {
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const REACT_APP_API_BASE = "https://risk-repost-backend.onrender.com";

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`${REACT_APP_API_BASE}/images`);
        if (!res.ok) throw new Error("Failed to fetch images");
        const data = await res.json();
        const urls = Array.isArray(data) ? data : data.images;
        if (Array.isArray(urls)) {
          setImages(urls);
        } else {
          throw new Error("Invalid image data format");
        }
      } catch (err) {
        console.error("Error fetching images:", err);
        setErrorMessage("Unable to load images. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleImageUpload = (newUrls) => {
    setImages((prev) => [...newUrls, ...prev]);
  };

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed.");
    }
  };

  const openPreview = (index) => {
    setCurrentIndex(index);
    setPreviewImage(images[index]);
  };

  const closePreview = () => setPreviewImage(null);

  const nextImage = useCallback(() => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    setPreviewImage(images[nextIndex]);
  }, [currentIndex, images]);

  const prevImage = useCallback(() => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    setPreviewImage(images[prevIndex]);
  }, [currentIndex, images]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!previewImage) return;
      if (e.key === "ArrowRight") nextImage();
      else if (e.key === "ArrowLeft") prevImage();
      else if (e.key === "Escape") closePreview();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage, nextImage, prevImage]);

  return (
    <div className="app">
      <h1 className="title">📸 Risk Repost Image Hub</h1>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {loading && <p style={{ textAlign: "center" }}>Loading images...</p>}

      <ImageUpload onUpload={handleImageUpload} />

      <div className="gallery">
        {images.map((url, idx) => (
          <div className="image-card" key={idx}>
            <img src={url} alt={`upload-${idx}`} onClick={() => openPreview(idx)} />
            <div className="image-actions">
              <button onClick={() => handleDownload(url)}>Download</button>
              <button onClick={() => openPreview(idx)}>Zoom</button>
            </div>
          </div>
        ))}
      </div>

      {previewImage && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="nav-button left" onClick={prevImage}>❮</button>
            <img src={previewImage} alt="preview" />
            <button className="nav-button right" onClick={nextImage}>❯</button>
            <div className="modal-buttons">
              <button onClick={() => handleDownload(previewImage)}>Download</button>
              <button onClick={closePreview}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
