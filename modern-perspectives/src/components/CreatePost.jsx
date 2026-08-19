// src/components/CreatePost.jsx
//
// Form for creating a NEW post, or editing an EXISTING one when
// `editingPost` is passed in (switches to PUT request).

import { useAuthContext } from "../context/AuthContext";
import "./CreatePost.css";
import night1Image from "../assets/images/night1.jpg";
import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function CreatePost({ onPostCreated, editingPost }) {
  const isEditing = !!editingPost;
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [authorName, setAuthorName] = useState(editingPost?.author_name || "");
  const [slogan, setSlogan] = useState(editingPost?.slogan || "");
  const [description, setDescription] = useState(editingPost?.description || "");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    editingPost ? `${API_BASE}${editingPost.image_url}` : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [rawImage, setRawImage] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropShape, setCropShape] = useState("rect");
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  const validateImage = (file) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSizeMB = 5;
    if (!allowedTypes.includes(file.type)) {
      return "Image must be JPG, PNG or WEBP!";
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Image size must be less than ${maxSizeMB}MB!`;
    }
    return null;
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const getCroppedImg = (imageSrc, pixelCrop) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Crop failed"));
            resolve(blob);
          },
          "image/jpeg",
          0.9
        );
      };
      image.onerror = reject;
    });
  };

  const handleCropConfirm = async () => {
    try {
      const croppedBlob = await getCroppedImg(rawImage, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], "cropped-image.jpg", {
        type: "image/jpeg",
      });
      setImageFile(croppedFile);
      setPreviewUrl(URL.createObjectURL(croppedFile));
      setShowCropModal(false);
      setRawImage(null);
    } catch (err) {
      setError("There was an error cropping the image!");
    }
  };

  const handleCancelImage = () => {
    setImageFile(null);
    setPreviewUrl(editingPost ? `${API_BASE}${editingPost.image_url}` : null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setError("");
    setRawImage(URL.createObjectURL(file));
    setShowCropModal(true);
  };

  const resetForm = () => {
    setAuthorName("");
    setSlogan("");
    setDescription("");
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!authorName.trim() || !slogan.trim() || !description.trim()) {
      setError("Complete all blanks!");
      return;
    }

    // New post requires image, edit can keep old image
    if (!isEditing && !imageFile) {
      setError("Insert Image Profile!");
      return;
    }

    const formData = new FormData();
    formData.append("author_name", authorName);
    formData.append("slogan", slogan);
    formData.append("description", description);
    if (imageFile) formData.append("image", imageFile);
    if (!isEditing && user?.email) formData.append("owner_email", user.email);

    try {
      setLoading(true);
      const url = isEditing
        ? `${API_BASE}/api/posts/${editingPost.id}`
        : `${API_BASE}/api/posts`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, { method, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error!");

      resetForm();
      if (onPostCreated) onPostCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url(${night1Image})`,
          backgroundSize: "cover",
          imageRendering: "crisp-edges",
          backgroundPosition: "center",
        }}
      />

      <form className="create-post-form" onSubmit={handleSubmit}>
        <h2 className="create-post-title">
          {isEditing ? "Update Perspective" : "Create Perspective!"}
        </h2>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="authorName">Name</label>
          <input
            id="authorName"
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="E.g. BRAVE1012"
            className="input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="slogan">Slogan</label>
          <input
            id="slogan"
            type="text"
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            placeholder="E.g. Never Say Never."
            maxLength={100}
            className="input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            placeholder="Geography"
            maxLength={10000}
          />
          <p
            style={{
              textAlign: "right",
              fontSize: 12,
              color: description.length >= 1000 ? "#ff8080" : "#a9b4c9",
              margin: "4px 0 0",
            }}
          >
            {description.length}/10000 Letters
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="image">
            Image {isEditing && <span style={{ opacity: 0.6 }}>(optional)</span>}
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
        </div>

        {previewUrl && (
          <div className="image-preview-wrapper">
            <div className="image-preview">
              <img src={previewUrl} alt="preview" />
            </div>
            {imageFile && (
              <button
                type="button"
                className="cancel-image-btn"
                onClick={handleCancelImage}
              >
                ✕ Cancel Image
              </button>
            )}
          </div>
        )}

        <button type="submit" disabled={loading} className="submit-btn">
          {loading
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
            ? "Update Post"
            : "Create Post"}
        </button>

        {showCropModal && (
          <div className="crop-modal-overlay">
            <div className="crop-modal">
              <h3 className="crop-modal-title">Crop Your Image</h3>

              <div className="crop-container">
                <Cropper
                  image={rawImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspectRatio}
                  cropShape={cropShape}
                  showGrid={true}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="crop-controls">
                <div className="crop-option-row">
                  <span className="crop-option-label">Shape</span>
                  <div className="crop-shape-toggle">
                    <button
                      type="button"
                      className={cropShape === "rect" ? "active" : ""}
                      onClick={() => setCropShape("rect")}
                    >
                      □ Rect
                    </button>
                    <button
                      type="button"
                      className={cropShape === "round" ? "active" : ""}
                      onClick={() => setCropShape("round")}
                    >
                      ○ Round
                    </button>
                  </div>
                </div>

                <div className="crop-option-row">
                  <span className="crop-option-label">Ratio</span>
                  <div className="crop-shape-toggle">
                    <button
                      type="button"
                      className={aspectRatio === 1 ? "active" : ""}
                      onClick={() => setAspectRatio(1)}
                    >
                      1:1
                    </button>
                    <button
                      type="button"
                      className={aspectRatio === 4 / 3 ? "active" : ""}
                      onClick={() => setAspectRatio(4 / 3)}
                    >
                      4:3
                    </button>
                    <button
                      type="button"
                      className={aspectRatio === 16 / 9 ? "active" : ""}
                      onClick={() => setAspectRatio(16 / 9)}
                    >
                      16:9
                    </button>
                  </div>
                </div>

                <div className="crop-option-row">
                  <span className="crop-option-label">Zoom</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="zoom-slider"
                  />
                </div>

                <div className="crop-actions">
                  <button
                    type="button"
                    className="crop-cancel-btn"
                    onClick={() => {
                      setShowCropModal(false);
                      setRawImage(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCropConfirm}
                    className="submit-btn"
                  >
                    Confirm Crop
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}