import React, { useEffect, useState, useCallback } from "react";
import "./App.css";

function App() {
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const API_BASE = "https://risk-repost-backend.onrender.com";

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`${API_BASE}/images`);
        if (!res.ok) throw new Error("Failed to fetch images");

        const data = await res.json();
        if (Array.isArray(data.images)) {
          setImages(data.images);
        } else {
          throw new Error("Invalid image data format");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setErrorMessage("Unable to load saved images.");
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      alert("No files selected.");
      return;
    }

    const formData = new FormData();
    for (let file of files) {
      formData.append("image", file); // match backend .array("image")
    }

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      const uploaded = Array.isArray(data.url) ? data.url : [data.url];
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. Try again.");
    }
  };

  const handleDownload = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "image.jpg";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download image.");
    }
  };

  const openPreview = (index) => {
    setCurrentIndex(index);
    setPreviewImage(images[index]);
  };

  const closePreview = () => setPreviewImage(null);

  const nextImage = useCallback(() => {
    const next = (currentIndex + 1) % images.length;
    setCurrentIndex(next);
    setPreviewImage(images[next]);
  }, [currentIndex, images]);

  const prevImage = useCallback(() => {
    const prev = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prev);
    setPreviewImage(images[prev]);
  }, [currentIndex, images]);

  useEffect(() => {
    const handleKeys = (e) => {
      if (!previewImage) return;
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") closePreview();
    };

    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [previewImage, nextImage, prevImage]);

  return (
    <div className="app">
      <h1 className="title">📸 Risk Repost Image Hub</h1>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {loading && <p style={{ textAlign: "center" }}>Loading images...</p>}

      <div className="upload-box">
        <label htmlFor="imageUpload" className="upload-label">
          Upload Images
        </label>
        <input
          id="imageUpload"
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleImageUpload}
        />
      </div>

      <div className="gallery">
        {images.map((url, idx) => (
          <div className="image-card" key={idx}>
            <img src={url} alt={`img-${idx}`} onClick={() => openPreview(idx)} />
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
