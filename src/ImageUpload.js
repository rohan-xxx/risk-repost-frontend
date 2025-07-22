import React, { useState } from "react";

function ImageUpload({ onUpload }) {
  const API = process.env.REACT_APP_API_BASE || "https://risk-repost-backend.onrender.com"; // fallback if env missing

  const [isUploading, setIsUploading] = useState(false);

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

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

      if (data.url) {
        onUpload(data.url); // send uploaded image URL to parent
      } else {
        alert("Upload failed: No URL returned");
      }
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
        📤 {isUploading ? "Uploading..." : "Upload Image"}
      </label>
      <input
        id="fileInput"
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: "none" }}
        disabled={isUploading}
      />
    </div>
  );
}

export default ImageUpload;
