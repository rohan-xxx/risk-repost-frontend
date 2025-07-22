import React from "react";

function ImageUpload({ onUpload }) {
  const API = process.env.REACT_APP_API_BASE;

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        onUpload(data.url); // Pass uploaded Cloudinary URL to parent
      } else {
        alert("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Upload error");
    }
  };

  return (
    <div className="upload-box">
      <label htmlFor="fileInput" className="upload-label">
        📤 Upload Image
      </label>
      <input
        id="fileInput"
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </div>
  );
}

export default ImageUpload;
