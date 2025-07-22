// src/App.js
import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [images, setImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  // Fetch images from backend
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/images`)
      .then((res) => res.json())
      .then((data) => setImages(data.images || []))
      .catch((err) => console.error("Error fetching images:", err));
  }, []);

  // Upload images to backend
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    const formData = new FormData();
    for (let file of files) {
      formData.append("image", file);
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/upload`, {
       {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setImages((prev) => [...prev, data.url]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleDownload = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageClick = (url) => {
    setPreviewImage(url);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div className="app">
      <h1 className="title">📸 Cloud Image Gallery</h1>

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
              style={{ cursor: "pointer", height: "180px", objectFit: "cover", width: "100%", borderRadius: "8px" }}
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
