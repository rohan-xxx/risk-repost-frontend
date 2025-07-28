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

  const [commentText, setCommentText] = useState("");
  const [selectedImageId, setSelectedImageId] = useState(null);

  const API_BASE = "https://risk-repost-backend.onrender.com";

  const fetchImages = async (page, append = false) => {
    try {
      const res = await fetch(`${API_BASE}/images?page=${page}`);
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();

      if (append) {
        setAllImages((prev) => [...prev, ...data.images]);
      } else {
        setAllImages(data.images);
      }

      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setErrorMessage("");
    } catch (err) {
      console.error(err);
      setErrorMessage("Error loading images.");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchImages(1, false);
      setLoading(false);
    })();
  }, []);

  const handleLike = async (id, index) => {
    try {
      const res = await fetch(`${API_BASE}/like/${id}`, { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setAllImages((prev) =>
          prev.map((img, idx) =>
            idx === index ? { ...img, likes: img.likes + 1 } : img
          )
        );
      } else {
        alert(data.error || "You already liked this image.");
      }
    } catch (err) {
      console.error(err);
      alert("Error liking image");
    }
  };

  const submitComment = async () => {
    if (!commentText) return alert("Enter a comment");

    try {
      const res = await fetch(`${API_BASE}/comment/${selectedImageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText }),
      });

      const data = await res.json();
      if (data.success) {
        const updatedImages = allImages.map((img) =>
          img.id === selectedImageId
            ? {
                ...img,
                comments: [...img.comments, { comment: commentText }],
              }
            : img
        );
        setAllImages(updatedImages);
        setCommentText("");
      } else {
        alert(data.error || "Error adding comment");
      }
    } catch (err) {
      console.error(err);
      alert("Error");
    }
  };

  const openPreview = (index) => {
    setCurrentIndex(index);
    setPreviewImage(allImages[index]);
    setSelectedImageId(allImages[index].id);
  };

  const closePreview = () => {
    setPreviewImage(null);
    setPendingNext(false);
  };

  useEffect(() => {
    if (previewImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [previewImage]);

  useEffect(() => {
    if (
      currentPage < totalPages &&
      allImages.length - currentIndex <= 3 &&
      !isFetchingMore
    ) {
      setIsFetchingMore(true);
      fetchImages(currentPage + 1, true).then(() => setIsFetchingMore(false));
    }
  }, [currentIndex, allImages.length, currentPage, totalPages, isFetchingMore]);

  const nextImage = useCallback(() => {
    if (!allImages.length) return;
    const nextIndex = currentIndex + 1;

    if (nextIndex < allImages.length) {
      setCurrentIndex(nextIndex);
      setPreviewImage(allImages[nextIndex]);
      setSelectedImageId(allImages[nextIndex].id);
    } else if (currentPage < totalPages && !isFetchingMore) {
      setIsFetchingMore(true);
      setPendingNext(true);
      fetchImages(currentPage + 1, true).then(() => {
        setIsFetchingMore(false);
      });
    }
  }, [currentIndex, allImages, currentPage, totalPages, isFetchingMore]);

  useEffect(() => {
    if (pendingNext && allImages.length > currentIndex + 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setPreviewImage(allImages[nextIndex]);
      setSelectedImageId(allImages[nextIndex].id);
      setPendingNext(false);
    }
  }, [allImages, pendingNext, currentIndex]);

  const prevImage = useCallback(() => {
    if (!allImages.length) return;
    const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    setCurrentIndex(prevIndex);
    setPreviewImage(allImages[prevIndex]);
    setSelectedImageId(allImages[prevIndex].id);
  }, [currentIndex, allImages]);

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (diff > 50) prevImage();
    if (diff < -50) nextImage();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!previewImage) return;

      if (e.key === "Escape") {
        closePreview();
      } else if (e.key === "ArrowRight") {
        nextImage();
      } else if (e.key === "ArrowLeft") {
        prevImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

      const uploadedData = await res.json();

      // ✅ Prepend new images to the gallery
      setAllImages((prev) => [...uploadedData.images, ...prev]);

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
        <>
          <div className="gallery">
            {allImages.map((img, idx) => (
              <div className="image-card" key={img.id}>
                <img src={img.url} alt="" onClick={() => openPreview(idx)} />
                <div className="card-buttons">
                  <button onClick={() => handleLike(img.id, idx)}>
                    ❤️ {img.likes}
                  </button>
                  <button onClick={() => openPreview(idx)}>💬 Comments</button>
                  <button onClick={() => downloadImage(img.url)}>
                    ⬇ Download
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button
              onClick={() => {
                setAllImages([]);
                fetchImages(currentPage - 1, false);
              }}
              disabled={currentPage === 1}
            >
              ⬅ Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => {
                setAllImages([]);
                fetchImages(currentPage + 1, false);
              }}
              disabled={currentPage === totalPages}
            >
              Next ➡
            </button>
          </div>
        </>
      )}

      {previewImage && (
        <div className="modal-overlay" onClick={closePreview}>
          <div
            className="modal-instagram"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="modal-left">
              <button className="nav-button left" onClick={prevImage}>
                ❮
              </button>
              <img src={previewImage.url} alt="" />
              <button className="nav-button right" onClick={nextImage}>
                ❯
              </button>
            </div>

            <div className="modal-right">
              <h3>❤️ {previewImage.likes} Likes</h3>
              <div className="comments-section">
                {previewImage.comments && previewImage.comments.length > 0 ? (
                  previewImage.comments.map((c, i) => (
                    <p key={i}>{c.comment}</p>
                  ))
                ) : (
                  <p>No comments yet.</p>
                )}
              </div>

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
              />
              <button onClick={submitComment}>Post</button>
              <button className="close-btn" onClick={closePreview}>
                ✖ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
