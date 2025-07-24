import React, { useEffect, useState, useCallback } from "react";
import "./App.css";

function App() {
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const API_BASE = "https://risk-repost-backend.onrender.com";

  const fetchImages = async (page) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/images?page=${page}`);
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data.images);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setErrorMessage("");
    } catch (err) {
      console.error("Error fetching images:", err);
      setErrorMessage("Something went wrong while loading images.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages(currentPage);
  }, [currentPage]);

  const openPreview = (index) => {
    setCurrentIndex(index);
    setPreviewImage(images[index]);
  };

  const closePreview = () => setPreviewImage(null);

  const nextImage = useCallback(() => {
    if (!images.length) return;
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    setPreviewImage(images[nextIndex]);
  }, [currentIndex, images]);

  const prevImage = useCallback(() => {
    if (!images.length) return;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    setPreviewImage(images[prevIndex]);
  }, [currentIndex, images]);

  const downloadImage = (url) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.setAttribute("download", "image.jpg");
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("image", files[i]); // use "image" only if your backend accepts multiple with same field
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      await fetchImages(currentPage); // Refresh image list
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">📸 Risk Repost Image Hub</h1>
          <p className="hero-subtitle">Upload. Explore. Inspire.</p>
          <label className="upload-btn">
            Upload Your Image 🚀
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {loading ? (
        <p style={{ textAlign: "center" }}>Loading images...</p>
      ) : (
        <>
          <div className="gallery">
            {images.map((url, idx) => (
              <div className="image-card" key={idx}>
                <img
                  src={url}
                  alt={`upload-${idx}`}
                  onClick={() => openPreview(idx)}
                />
                <div className="card-buttons">
                  <button onClick={() => openPreview(idx)}>🔍 Zoom</button>
                  <button onClick={() => downloadImage(url)}>⬇ Download</button>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              ⬅ Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next ➡
            </button>
          </div>
        </>
      )}

      {previewImage && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="nav-button left" onClick={prevImage}>
              ❮
            </button>
            <img src={previewImage} alt="preview" />
            <button className="nav-button right" onClick={nextImage}>
              ❯
            </button>
            <div className="modal-buttons">
              <button onClick={() => downloadImage(previewImage)}>
                ⬇ Download
              </button>
              <button onClick={closePreview}>✖ Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
