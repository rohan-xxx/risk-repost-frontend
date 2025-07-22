// src/App.js
import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const REACT_APP_API_BASE = https://risk-repost-backend.onrender.com;

  useEffect(() => {
    if (!REACT_APP_API_BASE) {
      console.error("API URL not defined in environment variables.");
      setErrorMessage("API URL is not configured. Please check your .env file.");
      return;
    }

    fetch(`${REACT_APP_API_BASE}/images`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch images");
        const data = await res.json();
        setImages(data.images || []);
      })
      .catch((err) => {
        console.error("Error fetching images:", err);
        setErrorMessage("Unable to load images. Please try again later.");
      });
  }, [REACT_APP_API_BASE]);

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      alert("No files selected.");
      return;
    }

    const formData = new FormData();
    for (let file of files) {
      formData.append("image", file);
    }

    try {
      const res = await fetch(`${REACT_APP_API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload request failed");

      const data = await res.json();

      if (data.url) {
        setImages((prev) => [...prev, data.url]);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    }
  };

  const handleDownload = (url) => {
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = "image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed.");
    }
  };

  const handleImageClick = (url) => setPreviewImage(url);
  const closePreview = () => setPreviewImage(null);

  return (
    <div className="app">
      <h1 className="title">📸 Cloud Image Gallery</h1>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

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
            <img
              src={url}
              alt={`upload-${idx}`}
              onClick={() => handleImageClick(url)}
              style={{
                cursor: "pointer",
                height: "180px",
                objectFit: "cover",
                width: "100%",
                borderRadius: "8px",
              }}
            />
            <div className="image-actions">
              <button onClick={() => handleDownload(url)}>Download</button>
              <button onClick={() => handleImageClick(url)}>Zoom</button>
            </div>
          </div>
        ))}
      </div>

      {previewImage && (
        <div className="preview-overlay" onClick={closePreview}>
          <div className="preview-box">
            <img src={previewImage} alt="preview" />
            <button className="close-btn" onClick={closePreview}>
              ❌ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
