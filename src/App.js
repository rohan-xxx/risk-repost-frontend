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
  const [commentText, setCommentText] = useState("");
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [clickedLikeIndex, setClickedLikeIndex] = useState(null);
  const [showHeart, setShowHeart] = useState(false);
  const [inputPage, setInputPage] = useState("");
  const [transitionDirection, setTransitionDirection] = useState("");
  let lastTap = 0;

  const API_BASE = "http://localhost:5000";

  const fetchImages = async (page, append = false) => {
    try {
      const res = await fetch(`${API_BASE}/images?page=${page}`);
      const data = await res.json();
      const formatted = data.images.map((img) => ({
        ...img,
        liked: false,
        likes: Number(img.likes),
      }));
      setAllImages((prev) => (append ? [...prev, ...formatted] : formatted));
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("page", data.currentPage);
      window.history.replaceState(null, "", newUrl.toString());

      setErrorMessage("");
    } catch {
      setErrorMessage("Error loading images.");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const savedPage = Number(params.get("page")) || 1;
      await fetchImages(savedPage, false);
      setLoading(false);
    })();
  }, []);

  const handleLike = async (id, index) => {
    if (allImages[index].liked) return;
    setClickedLikeIndex(index);
    setAllImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, likes: img.likes + 1, liked: true } : img
      )
    );
    try {
      const res = await fetch(`${API_BASE}/like/${id}`, { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error();
    } catch {
      setAllImages((prev) =>
        prev.map((img, i) =>
          i === index ? { ...img, likes: img.likes - 1, liked: false } : img
        )
      );
    } finally {
      setTimeout(() => setClickedLikeIndex(null), 500);
    }
  };

  const triggerDoubleLike = () => {
    if (!allImages[currentIndex].liked) {
      handleLike(previewImage.id, currentIndex);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
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
        setAllImages((prev) =>
          prev.map((img) =>
            img.id === selectedImageId
              ? {
                  ...img,
                  comments: [...img.comments, { comment: commentText }],
                }
              : img
          )
        );
        setCommentText("");
      } else {
        alert(data.error || "Error adding comment");
      }
    } catch {
      alert("Error");
    }
  };

  const openPreview = (idx) => {
    setCurrentIndex(idx);
    setPreviewImage(allImages[idx]);
    setSelectedImageId(allImages[idx].id);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  useEffect(() => {
    document.body.style.overflow = previewImage ? "hidden" : "auto";
  }, [previewImage]);

  const nextImage = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < allImages.length) {
      setTransitionDirection("left");
      setCurrentIndex(nextIndex);
      setPreviewImage(allImages[nextIndex]);
      setSelectedImageId(allImages[nextIndex].id);
    }
  }, [currentIndex, allImages]);

  const prevImage = useCallback(() => {
    const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
    setTransitionDirection("right");
    setCurrentIndex(prevIndex);
    setPreviewImage(allImages[prevIndex]);
    setSelectedImageId(allImages[prevIndex].id);
  }, [currentIndex, allImages]);

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (diff > 50) prevImage();
    else if (diff < -50) nextImage();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!previewImage) return;
      if (e.key === "Escape") closePreview();
      else if (e.key === "ArrowRight") nextImage();
      else if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage, nextImage, prevImage]);

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
            onChange={async (e) => {
              const files = e.target.files;
              if (!files.length) return;
              const formData = new FormData();
              for (let i = 0; i < files.length; i++) {
                formData.append("image", files[i]);
              }
              setLoading(true);
              const res = await fetch(`${API_BASE}/upload`, {
                method: "POST",
                body: formData,
              });
              const data = await res.json();
              const newImgs = data.images.map((img) => ({
                ...img,
                liked: false,
                likes: Number(img.likes),
              }));
              setAllImages((prev) => [...newImgs, ...prev]);
              setLoading(false);
            }}
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
                  <button
                    className={`like-button ${
                      clickedLikeIndex === idx ? "clicked" : ""
                    }`}
                    onClick={() => handleLike(img.id, idx)}
                  >
                    ❤️ {img.likes}
                  </button>
                  <button onClick={() => openPreview(idx)}>💬 Comments</button>
                  <button onClick={() => window.open(img.url)}>⬇ Download</button>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => {
                if (currentPage > 1) {
                  setLoading(true);
                  fetchImages(currentPage - 1).then(() => setLoading(false));
                }
              }}
              disabled={currentPage === 1}
            >
              ◀ Previous
            </button>

            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>

            <input
              type="number"
              min="1"
              max={totalPages}
              placeholder="Go to page"
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value)}
              className="page-input"
              style={{ marginLeft: "10px", padding: "5px", width: "80px" }}
            />
            <button
              className="pagination-btn"
              onClick={() => {
                const targetPage = Number(inputPage);
                if (
                  !isNaN(targetPage) &&
                  targetPage >= 1 &&
                  targetPage <= totalPages
                ) {
                  setLoading(true);
                  fetchImages(targetPage).then(() => {
                    setLoading(false);
                    setInputPage("");
                  });
                }
              }}
            >
              Go
            </button>

            <button
              className="pagination-btn"
              onClick={() => {
                if (currentPage < totalPages) {
                  setLoading(true);
                  fetchImages(currentPage + 1).then(() => setLoading(false));
                }
              }}
              disabled={currentPage === totalPages}
            >
              Next ▶
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
            <div className="modal-left image-wrapper">
              <button className="nav-button left" onClick={prevImage}>
                ❮
              </button>
              <img
                src={previewImage.url}
                alt=""
                className={
                  transitionDirection === "left"
                    ? "image-slide-left"
                    : transitionDirection === "right"
                    ? "image-slide-right"
                    : ""
                }
                onAnimationEnd={() => setTransitionDirection("")}
                onDoubleClick={triggerDoubleLike}
                onTouchStart={() => {
                  const now = Date.now();
                  if (now - lastTap < 300) triggerDoubleLike();
                  lastTap = now;
                }}
              />
              {showHeart && <div className="heart-overlay">❤️</div>}
              <button className="nav-button right" onClick={nextImage}>
                ❯
              </button>
            </div>

            <div className="modal-right">
              <h3>❤️ {previewImage.likes} Likes</h3>
              <div className="comments-section">
                {previewImage.comments?.length ? (
                  previewImage.comments.map((c, i) => <p key={i}>{c.comment}</p>)
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
