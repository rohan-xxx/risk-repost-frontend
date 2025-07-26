import React, { useEffect, useState, useCallback } from "react";
import "./App.css";

function App() {
  const [allImages, setAllImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [touchStartX, setTouchStartX] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [pendingNext, setPendingNext] = useState(false);

  const API_BASE = "https://risk-repost-backend.onrender.com";

  // ✅ Fetch images and append
  const fetchImages = async (page) => {
    try {
      const res = await fetch(`${API_BASE}/images?page=${page}`);
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();

      setAllImages((prev) => [...prev, ...data.images]);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (err) {
      console.error(err);
      setErrorMessage("Error loading images.");
    }
  };

  // ✅ Initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchImages(1);
      setLoading(false);
    })();
  }, []);

  const openPreview = (index) => {
    setCurrentIndex(index);
    setPreviewImage(allImages[index]);
  };

  const closePreview = () => {
    setPreviewImage(null);
    setPendingNext(false);
  };

  // ✅ Prefetch next page early
  useEffect(() => {
    if (currentPage < totalPages && allImages.length - currentIndex <= 3 && !isFetchingMore) {
      setIsFetchingMore(true);
      fetchImages(currentPage + 1).then(() => setIsFetchingMore(false));
    }
  }, [currentIndex, allImages.length, currentPage, totalPages, isFetchingMore]);

  // ✅ Handle next navigation (safe)
  const nextImage = useCallback(() => {
    if (!allImages.length) return;
    const nextIndex = currentIndex + 1;

    if (nextIndex < allImages.length) {
      setCurrentIndex(nextIndex);
      setPreviewImage(allImages[nextIndex]);
    } else if (currentPage < totalPages && !isFetchingMore) {
      setIsFetchingMore(true);
      setPendingNext(true); // Wait until new images arrive
      fetchImages(currentPage + 1).then(() => {
        setIsFetchingMore(false);
      });
    }
  }, [currentIndex, allImages, currentPage, totalPages, isFetchingMore]);

  // ✅ When new images are appended, continue navigation if pending
  useEffect(() => {
    if (pendingNext && allImages.length > currentIndex + 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setPreviewImage(allImages[nextIndex]);
      setPendingNext(false);
    }
  }, [allImages, pendingNext, currentIndex]);

  const prevImage = useCallback(() => {
    if (!allImages.length) return;
    const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    setCurrentIndex(prevIndex);
    setPreviewImage(allImages[prevIndex]);
  }, [currentIndex, allImages]);

  // ✅ Swipe
  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (diff > 50) prevImage();
    if (diff < -50) nextImage();
  };

  // ✅ Keyboard
  useEffect(() => {
    if (!previewImage) return;
    const keyHandler = (e) => {
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [previewImage, nextImage, prevImage]);

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
      formData.append("image", files[i]);
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");

      setAllImages([]);
      setCurrentPage(1);
      await fetchImages(1);
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
        <h1 className="hero-title">📸 Risk Repost Image Hub</h1>
        <p className="hero-subtitle">Upload. Explore. Inspire.</p>
        <label className="upload-btn">
          Upload Your Image 🚀
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </label>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {loading && allImages.length === 0 ? (
        <p style={{ textAlign: "center" }}>Loading images...</p>
      ) : (
        <div className="gallery">
          {allImages.map((url, idx) => (
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
      )}

      {previewImage && (
        <div className="modal-overlay" onClick={closePreview}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button className="nav-button left" onClick={prevImage}>
              ❮
            </button>
            <img src={previewImage} alt="preview" />
            <button className="nav-button right" onClick={nextImage}>
              ❯
            </button>
            <div className="modal-buttons">
              <button onClick={() => downloadImage(previewImage)}>⬇ Download</button>
              <button onClick={closePreview}>✖ Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
