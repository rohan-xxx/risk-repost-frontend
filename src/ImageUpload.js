import React, { useState } from "react";

function ImageUpload({ onUpload }) {
  const API = "https://risk-repost-backend.onrender.com";
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let file of files) {
      formData.append("image", file); // ✅ Field name matches backend
    }

    try {
      setIsUploading(true);

      const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Upload failed: ${text}`);
      }

      const data = await res.json();
      const urls = Array.isArray(data.url) ? data.url : [data.url];

      // ✅ Notify parent of new images
      if (onUpload) onUpload(urls);
    } catch (error) {
      console.error("Image upload error:", error);
      alert(`Upload error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-box">
      <label htmlFor="fileInput" className="upload-label">
        📤 {isUploading ? "Uploading..." : "Upload Images"}
      </label>
      <input
        id="fileInput"
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        style={{ display: "none" }}
        disabled={isUploading}
      />
    </div>
  );
}

export default ImageUpload;
